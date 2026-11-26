package com.workgo.job.service;

import com.workgo.job.dto.response.JobAttachmentDto;
import com.workgo.job.entity.Job;
import com.workgo.job.entity.JobAttachment;
import com.workgo.job.enumeration.JobStatus;
import com.workgo.job.exception.AppException;
import com.workgo.job.exception.ErrorCode;
import com.workgo.job.exception.JobNotFoundException;
import com.workgo.job.mapper.JobAttachmentMapper;
import com.workgo.job.repository.ApplicationRepository;
import com.workgo.job.repository.JobAttachmentRepository;
import com.workgo.job.repository.ProposalRepository;
import com.workgo.job.service.storage.FileStorage;
import com.workgo.job.service.storage.LocalFileStorage;
import com.workgo.job.utils.TokenUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Job attachment storage service enforcing server-generated IDs, magic-byte validation,
 * 10-file / 20 MiB per-file / 100 MiB total quotas, and 5-minute signed download URLs (C02 / DEV-07).
 */
@Service
public class JobAttachmentService {

    private static final int MAX_FILES_PER_JOB = 10;
    private static final long MAX_FILE_BYTES = 20L * 1024 * 1024;
    private static final long MAX_TOTAL_BYTES = 100L * 1024 * 1024;
    private static final long LINK_TTL_SECONDS = 300L;

    private static final Set<String> ALLOWED_MIMES = Set.of(
            "image/png", "image/jpeg", "image/webp", "application/pdf", "application/zip"
    );
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "html", "htm", "js", "mjs", "cjs", "php", "phtml", "exe", "dll", "bat", "cmd", "sh", "ps1", "jsp", "jspx", "svg", "xhtml"
    );

    private final JobAttachmentRepository attachments;
    private final ProposalRepository proposals;
    private final ApplicationRepository applications;
    private final JobAccess access;
    private final JobAttachmentMapper mapper;
    private final TokenUtils token;
    private final FileStorage storage;
    private final byte[] signingKey;
    private final String publicBase;

    public JobAttachmentService(JobAttachmentRepository attachments,
                                ProposalRepository proposals,
                                ApplicationRepository applications,
                                JobAccess access,
                                JobAttachmentMapper mapper,
                                TokenUtils token,
                                @Value("${app.storage.local-dir:./.workgo-storage/job}") String localDir,
                                @Value("${app.storage.signing-key:}") String signingKey,
                                @Value("${app.storage.public-base-url:/api/v1/job}") String publicBase) {
        this(attachments, proposals, applications, access, mapper, token, new LocalFileStorage(localDir), signingKey, publicBase);
    }

    @Autowired
    public JobAttachmentService(JobAttachmentRepository attachments,
                                ProposalRepository proposals,
                                ApplicationRepository applications,
                                JobAccess access,
                                JobAttachmentMapper mapper,
                                TokenUtils token,
                                FileStorage storage,
                                @Value("${app.storage.signing-key:}") String signingKey,
                                @Value("${app.storage.public-base-url:/api/v1/job}") String publicBase) {
        this.attachments = attachments;
        this.proposals = proposals;
        this.applications = applications;
        this.access = access;
        this.mapper = mapper;
        this.token = token;
        this.storage = storage;
        this.signingKey = signingKey == null || signingKey.length() < 32 ? randomKey() : signingKey.getBytes(StandardCharsets.UTF_8);
        this.publicBase = (publicBase == null || publicBase.isBlank() ? "/api/v1/job" : publicBase).replaceAll("/+$", "");
    }

    @Transactional
    public JobAttachmentDto upload(UUID jobId, MultipartFile file) {
        return upload(jobId, file, null);
    }

    @Transactional
    public JobAttachmentDto upload(UUID jobId, MultipartFile file, String expectedSha256) {
        Job job = access.lock(jobId);
        access.owner(job);
        if (job.getStatus() != JobStatus.OPEN && job.getStatus() != JobStatus.PAUSED) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if (proposals.existsByJob_JobId(jobId)) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if (file == null || file.isEmpty() || file.getSize() <= 0 || file.getSize() > MAX_FILE_BYTES) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String cleanFileName = validateAndCleanFilename(file.getOriginalFilename());
        byte[] content;
        try (var in = file.getInputStream()) {
            content = in.readNBytes((int) MAX_FILE_BYTES + 1);
        } catch (IOException e) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        if (content.length == 0 || content.length > MAX_FILE_BYTES) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String mime = detect(content);
        if (mime == null || !ALLOWED_MIMES.contains(mime)
                || !isDeclaredMimeCompatible(file.getContentType(), mime)
                || isPolyglotPayload(content, mime)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String sha = digest(content);
        if (expectedSha256 != null && !expectedSha256.isBlank()
                && !sha.equalsIgnoreCase(expectedSha256.trim())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var existing = attachments.findFirstByJob_JobIdAndSha256OrderByCreatedAtAsc(jobId, sha);
        if (existing.isPresent()) {
            JobAttachment prev = existing.get();
            if ("READY".equals(prev.getStatus()) && prev.getStorageKey() != null && storage.exists(prev.getStorageKey())) {
                return mapper.toDto(prev);
            }
        }

        List<JobAttachment> currentFiles = attachments.findByJob_JobId(jobId).stream()
                .filter(a -> "READY".equals(a.getStatus()))
                .toList();
        if (currentFiles.size() >= MAX_FILES_PER_JOB) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        long currentTotal = currentFiles.stream()
                .mapToLong(a -> a.getSizeBytes() == null ? 0L : a.getSizeBytes())
                .sum();
        if (currentTotal + content.length > MAX_TOTAL_BYTES) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        UUID objectId = UUID.randomUUID();
        String storageKey = "jobs/" + jobId + "/" + objectId;
        boolean written = false;
        try {
            storage.put(storageKey, content, mime);
            written = true;
            byte[] verified = storage.get(storageKey);
            if (verified == null || !digest(verified).equals(sha)) {
                storage.delete(storageKey);
                throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
            }
            JobAttachment entity = JobAttachment.builder()
                    .job(job)
                    .fileName(cleanFileName)
                    .mimeType(mime)
                    .sizeBytes((long) content.length)
                    .sha256(sha)
                    .storageKey(storageKey)
                    .uploadedBy(token.getCurrentUserId())
                    .status("READY")
                    .fileUrl(publicBase + "/jobs/" + jobId + "/attachments")
                    .build();
            JobAttachment saved = attachments.saveAndFlush(entity);
            saved.setFileUrl(publicBase + "/jobs/attachments/" + saved.getAttachmentId() + "/content");
            saved = attachments.saveAndFlush(saved);
            job.getAttachments().add(saved);
            return mapper.toDto(saved);
        } catch (RuntimeException ex) {
            if (written) {
                storage.delete(storageKey);
            }
            throw ex;
        }
    }

    public record Download(String url, Instant expiresAt) {}

    public Download download(UUID jobId, UUID attachmentId) {
        Job job = access.read(jobId);
        assertCanReadAttachment(job);
        JobAttachment attachment = attachments.findById(attachmentId)
                .filter(a -> a.getJob() != null && jobId.equals(a.getJob().getJobId()))
                .orElseThrow(JobNotFoundException::new);
        if (!"READY".equals(attachment.getStatus()) || attachment.getStorageKey() == null || !storage.exists(attachment.getStorageKey())) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        Instant expiry = Instant.now().plusSeconds(LINK_TTL_SECONDS);
        String signature = sign(attachmentId, expiry.getEpochSecond());
        return new Download(publicBase + "/jobs/attachments/" + attachmentId + "/content?expires=" + expiry.getEpochSecond() + "&signature=" + signature, expiry);
    }

    public record Content(byte[] bytes, String mime, String fileName) {}

    public Content content(UUID attachmentId, long expires, String signature) {
        long now = Instant.now().getEpochSecond();
        if (expires <= now || expires > now + LINK_TTL_SECONDS || signature == null
                || !MessageDigest.isEqual(sign(attachmentId, expires).getBytes(StandardCharsets.US_ASCII), signature.getBytes(StandardCharsets.US_ASCII))) {
            throw new AccessDeniedException("Expired or invalid download link");
        }
        JobAttachment attachment = attachments.findById(attachmentId)
                .orElseThrow(JobNotFoundException::new);
        if (!"READY".equals(attachment.getStatus()) || attachment.getStorageKey() == null) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        byte[] bytes = storage.get(attachment.getStorageKey());
        if (bytes == null || (attachment.getSha256() != null && !digest(bytes).equals(attachment.getSha256()))) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        return new Content(bytes, attachment.getMimeType(), attachment.getFileName() == null ? "attachment" : attachment.getFileName());
    }

    private void assertCanReadAttachment(Job job) {
        boolean publicOpen = !job.isModerationHidden()
                && job.getStatus() == JobStatus.OPEN
                && (job.getDeadlineAt() == null || job.getDeadlineAt().isAfter(Instant.now()));
        try {
            UUID currentUser = token.getCurrentUserId();
            if (job.getClientId().equals(currentUser) && token.hasRole("ROLE_CLIENT")) {
                return;
            }
            if (token.hasRole("ROLE_ADMIN") || token.hasRole("ROLE_SUPER_ADMIN")) {
                return;
            }
            UUID providerId = token.getCurrentProviderIdOrNull();
            if (providerId != null && applications.existsByJob_JobIdAndProviderId(job.getJobId(), providerId)) {
                return;
            }
            if (publicOpen) {
                return;
            }
        } catch (AuthenticationException ignored) {
            if (publicOpen) {
                return;
            }
        }
        throw new AccessDeniedException("Attachment access denied");
    }

    private String sign(UUID id, long expiry) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((id + "|" + expiry).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] randomKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return key;
    }

    private static String digest(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String detect(byte[] b) {
        if (b.length >= 8 && Arrays.equals(Arrays.copyOf(b, 8), new byte[]{(byte) 137, 80, 78, 71, 13, 10, 26, 10})) return "image/png";
        if (b.length >= 3 && b[0] == (byte) 255 && b[1] == (byte) 216 && b[2] == (byte) 255) return "image/jpeg";
        if (b.length >= 12
                && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) return "image/webp";
        if (b.length >= 5 && new String(b, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) return "application/pdf";
        if (b.length >= 4 && b[0] == 'P' && b[1] == 'K' && b[2] == 0x03 && b[3] == 0x04) return "application/zip";
        return null;
    }

    private static boolean isDeclaredMimeCompatible(String declaredContentType, String detectedMime) {
        if (declaredContentType == null || declaredContentType.isBlank()) return true;
        String base = declaredContentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        if (base.isEmpty() || "application/octet-stream".equals(base) || "multipart/form-data".equals(base)) return true;
        if ("image/jpg".equals(base)) base = "image/jpeg";
        if ("application/x-zip-compressed".equals(base)) base = "application/zip";
        return detectedMime.equalsIgnoreCase(base);
    }

    private static boolean isPolyglotPayload(byte[] content, String detectedMime) {
        int inspectLen = Math.min(content.length, 4096);
        String head = new String(content, 0, inspectLen, StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT);
        String tail = content.length > 4096
                ? new String(content, content.length - 4096, 4096, StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT)
                : "";
        String sample = head + "\n" + tail;
        if (sample.contains("<script") || sample.contains("<?php") || sample.contains("<html") || sample.contains("<!doctype html")) {
            return true;
        }
        if (detectedMime.startsWith("image/")) {
            return sample.contains("javascript:") || sample.contains("onerror=") || sample.contains("onload=");
        }
        return false;
    }

    private static String validateAndCleanFilename(String name) {
        if (name == null || name.isBlank()) return "attachment";
        if (name.indexOf('\0') >= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String normalized = name.replace('\\', '/');
        if (normalized.contains("../") || normalized.contains("/..") || normalized.startsWith("/")) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String base = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (base.isEmpty() || ".".equals(base) || "..".equals(base)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String[] parts = base.toLowerCase(Locale.ROOT).split("\\.");
        for (int i = 1; i < parts.length; i++) {
            if (DANGEROUS_EXTENSIONS.contains(parts[i])) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
        }
        String cleaned = base.replaceAll("[\\r\\n\"\\\\]", "_");
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }
}
