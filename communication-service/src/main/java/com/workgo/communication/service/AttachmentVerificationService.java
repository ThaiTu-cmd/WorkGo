package com.workgo.communication.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.workgo.communication.dto.request.AttachmentReq;
import com.workgo.communication.entity.Conversation;
import com.workgo.communication.entity.MediaAttachment;
import com.workgo.communication.enumeration.ConversationStatus;
import com.workgo.communication.exception.AppException;
import com.workgo.communication.exception.ErrorCode;
import com.workgo.communication.service.storage.FileStorage;
import com.workgo.communication.service.storage.LocalFileStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Trusted attachment upload, verification, and 5-minute signed download service for Communication (C02 / DEV-07).
 * Never fetches arbitrary client URLs; only server-uploaded READY attachments owned by the sender in the conversation are accepted.
 */
@Service
public class AttachmentVerificationService {

    private static final long MAX_FILE_BYTES = 20L * 1024 * 1024;
    private static final long MAX_TOTAL_BYTES = 100L * 1024 * 1024;
    private static final int MAX_FILES_PER_MESSAGE = 10;
    private static final int MAX_UPLOADED_PER_CONVERSATION_USER = 50;
    private static final long LINK_TTL_SECONDS = 300L;

    private static final Pattern TRUSTED_PATH_PATTERN = Pattern.compile(
            "(?:^|/)(?:api/v1/)?(?:communication/)?attachments/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/content$"
    );

    private static final Set<String> ALLOWED_MIMES = Set.of(
            "image/png", "image/jpeg", "image/webp", "application/pdf", "application/zip", "video/mp4"
    );
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "html", "htm", "js", "mjs", "cjs", "php", "phtml", "exe", "dll", "bat", "cmd", "sh", "ps1", "jsp", "jspx", "svg", "xhtml"
    );

    private final ConversationService conversations;
    private final FileStorage storage;
    private final Clock clock;
    private final byte[] signingKey;
    private final String publicBaseUrl;

    private final Map<UUID, StoredAttachmentRecord> recordsById = new ConcurrentHashMap<>();
    private final Map<String, UUID> readyByConvUserSha = new ConcurrentHashMap<>();

    public AttachmentVerificationService(ConversationService conversations) {
        this(conversations, new LocalFileStorage("./.workgo-storage/communication"), Clock.systemUTC(), "", "http://localhost:8086/communication");
    }

    @Autowired
    public AttachmentVerificationService(
            ConversationService conversations,
            @Autowired(required = false) FileStorage storage,
            @Autowired(required = false) Clock clock,
            @Value("${app.storage.signing-key:}") String signingKey,
            @Value("${app.storage.public-base-url:http://localhost:8086/communication}") String publicBaseUrl) {
        this.conversations = conversations;
        this.storage = storage != null ? storage : new LocalFileStorage("./.workgo-storage/communication");
        this.clock = clock != null ? clock : Clock.systemUTC();
        this.signingKey = signingKey == null || signingKey.length() < 32 ? randomKey() : signingKey.getBytes(StandardCharsets.UTF_8);
        this.publicBaseUrl = (publicBaseUrl == null || publicBaseUrl.isBlank() ? "http://localhost:8086/communication" : publicBaseUrl)
                .replaceAll("/+$", "");
    }

    public record FileDescriptor(
            UUID id,
            String fileUrl,
            String fileName,
            String mime,
            long size,
            String sha256,
            String status,
            Instant createdAt) {

        @JsonProperty("attachmentId")
        public UUID attachmentId() {
            return id;
        }

        @JsonProperty("mimeType")
        public String mimeType() {
            return mime;
        }

        @JsonProperty("sizeBytes")
        public long sizeBytes() {
            return size;
        }
    }

    public record StoredAttachmentRecord(
            UUID id,
            UUID conversationId,
            UUID uploaderId,
            String storageKey,
            String fileName,
            String mime,
            long size,
            String sha256,
            String status,
            Instant createdAt) {}

    public FileDescriptor upload(UUID actorId, UUID conversationId, MultipartFile file) {
        return upload(actorId, conversationId, file, null);
    }

    public FileDescriptor upload(UUID actorId, UUID conversationId, MultipartFile file, String expectedSha256) {
        Conversation room = conversations.requireParticipant(actorId, conversationId);
        if (room.getStatus() != ConversationStatus.ACTIVE) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_ACTIVE);
        }
        if (file == null || file.isEmpty() || file.getSize() <= 0 || file.getSize() > MAX_FILE_BYTES) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String cleanFileName = validateAndCleanFilename(file.getOriginalFilename());
        byte[] content;
        try (var in = file.getInputStream()) {
            content = in.readNBytes((int) MAX_FILE_BYTES + 1);
        } catch (IOException e) {
            throw new DataAccessResourceFailureException("Cannot read uploaded attachment stream", e);
        }
        if (content.length == 0 || content.length > MAX_FILE_BYTES) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String mime = detect(content);
        if (mime == null || !ALLOWED_MIMES.contains(mime)
                || !isDeclaredMimeCompatible(file.getContentType(), mime)
                || isPolyglotPayload(content, mime)) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String sha = digest(content);
        if (expectedSha256 != null && !expectedSha256.isBlank()
                && !sha.equalsIgnoreCase(expectedSha256.trim())) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }

        String dedupKey = conversationId + ":" + actorId + ":" + sha;
        UUID existingId = readyByConvUserSha.get(dedupKey);
        if (existingId != null) {
            StoredAttachmentRecord prev = recordsById.get(existingId);
            if (prev != null && "READY".equals(prev.status()) && storage.exists(prev.storageKey())) {
                return toDescriptor(prev);
            }
        }

        long userCount = recordsById.values().stream()
                .filter(r -> conversationId.equals(r.conversationId()) && actorId.equals(r.uploaderId()) && "READY".equals(r.status()))
                .count();
        if (userCount >= MAX_UPLOADED_PER_CONVERSATION_USER) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }

        UUID fileId = UUID.randomUUID();
        String storageKey = "conversations/" + conversationId + "/" + fileId;
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        boolean written = false;
        try {
            storage.put(storageKey, content);
            written = true;
            byte[] verified = storage.get(storageKey);
            if (verified == null || !digest(verified).equals(sha)) {
                storage.delete(storageKey);
                throw new DataAccessResourceFailureException("Attachment storage verification failed");
            }
            StoredAttachmentRecord record = new StoredAttachmentRecord(
                    fileId, conversationId, actorId, storageKey, cleanFileName, mime, content.length, sha, "READY", now
            );
            recordsById.put(fileId, record);
            readyByConvUserSha.put(dedupKey, fileId);
            return toDescriptor(record);
        } catch (RuntimeException ex) {
            if (written) {
                storage.delete(storageKey);
            }
            throw ex;
        }
    }

    public List<MediaAttachment> verifyAndResolve(
            UUID actorId, UUID conversationId, List<AttachmentReq> attachments, int maxCount, long maxFile, long maxTotal) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        int effectiveMaxCount = Math.min(maxCount, MAX_FILES_PER_MESSAGE);
        long effectiveMaxFile = Math.min(maxFile, MAX_FILE_BYTES);
        long effectiveMaxTotal = Math.min(maxTotal, MAX_TOTAL_BYTES);
        if (attachments.size() > effectiveMaxCount) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }

        long runningTotal = 0L;
        List<MediaAttachment> resolved = new ArrayList<>(attachments.size());
        for (AttachmentReq req : attachments) {
            if (req == null || req.fileUrl() == null || req.fileUrl().isBlank()
                    || req.sizeBytes() == null || req.sizeBytes() <= 0 || req.sizeBytes() > effectiveMaxFile) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
            UUID fileId = extractTrustedFileId(req.fileUrl());
            if (fileId == null) {
                // External arbitrary URLs are never fetched or trusted; fail closed as untrusted/unavailable verification.
                throw new DataAccessResourceFailureException("Attachment verification unavailable for external or untrusted URL");
            }
            StoredAttachmentRecord record = recordsById.get(fileId);
            if (record == null) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
            if (!conversationId.equals(record.conversationId()) || !actorId.equals(record.uploaderId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            if (!"READY".equals(record.status())) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
            if (record.size() != req.sizeBytes()) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
            if (req.mimeType() != null && !req.mimeType().isBlank() && !record.mime().equalsIgnoreCase(req.mimeType().trim())) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
            runningTotal += record.size();
            if (runningTotal > effectiveMaxTotal) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
            byte[] storedBytes = storage.get(record.storageKey());
            if (storedBytes == null || storedBytes.length != record.size() || !digest(storedBytes).equals(record.sha256())) {
                throw new DataAccessResourceFailureException("Stored attachment is missing or corrupted");
            }
            resolved.add(MediaAttachment.builder()
                    .id(record.id())
                    .fileUrl(canonicalFileUrl(record.id()))
                    .fileName(record.fileName())
                    .mimeType(record.mime())
                    .sizeBytes(record.size())
                    .createdAt(record.createdAt())
                    .build());
        }
        return resolved;
    }

    public record Download(String url, Instant expiresAt) {}

    public Download download(UUID actorId, UUID conversationId, UUID attachmentId) {
        conversations.requireParticipant(actorId, conversationId);
        StoredAttachmentRecord record = recordsById.get(attachmentId);
        if (record == null || !conversationId.equals(record.conversationId())) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        if (!"READY".equals(record.status()) || !storage.exists(record.storageKey())) {
            throw new DataAccessResourceFailureException("Attachment object is unavailable");
        }
        Instant expiry = clock.instant().plusSeconds(LINK_TTL_SECONDS);
        String signature = sign(attachmentId, expiry.getEpochSecond());
        return new Download("/communication/attachments/" + attachmentId + "/content?expires=" + expiry.getEpochSecond() + "&signature=" + signature, expiry);
    }

    public record Content(byte[] bytes, String mime, String fileName) {}

    public Content content(UUID actorId, UUID attachmentId, long expires, String signature) {
        long now = clock.instant().getEpochSecond();
        if (expires <= now || expires > now + LINK_TTL_SECONDS || signature == null
                || !MessageDigest.isEqual(sign(attachmentId, expires).getBytes(StandardCharsets.US_ASCII), signature.getBytes(StandardCharsets.US_ASCII))) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        StoredAttachmentRecord record = recordsById.get(attachmentId);
        if (record == null) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        if (actorId != null) {
            conversations.requireParticipant(actorId, record.conversationId());
        }
        if (!"READY".equals(record.status())) {
            throw new DataAccessResourceFailureException("Attachment is not ready");
        }
        byte[] bytes = storage.get(record.storageKey());
        if (bytes == null || !digest(bytes).equals(record.sha256())) {
            throw new DataAccessResourceFailureException("Attachment content integrity check failed");
        }
        return new Content(bytes, record.mime(), record.fileName());
    }

    public void markStatusForTest(UUID attachmentId, String status) {
        StoredAttachmentRecord current = recordsById.get(attachmentId);
        if (current != null) {
            recordsById.put(attachmentId, new StoredAttachmentRecord(
                    current.id(), current.conversationId(), current.uploaderId(), current.storageKey(),
                    current.fileName(), current.mime(), current.size(), current.sha256(), status, current.createdAt()
            ));
        }
    }

    private FileDescriptor toDescriptor(StoredAttachmentRecord record) {
        return new FileDescriptor(
                record.id(),
                canonicalFileUrl(record.id()),
                record.fileName(),
                record.mime(),
                record.size(),
                record.sha256(),
                record.status(),
                record.createdAt()
        );
    }

    private String canonicalFileUrl(UUID id) {
        String base = publicBaseUrl.startsWith("http://") || publicBaseUrl.startsWith("https://")
                ? publicBaseUrl
                : "http://localhost:8086" + (publicBaseUrl.startsWith("/") ? publicBaseUrl : "/" + publicBaseUrl);
        return base + "/attachments/" + id + "/content";
    }

    private UUID extractTrustedFileId(String fileUrl) {
        try {
            URI uri = URI.create(fileUrl);
            if (uri.getPath() == null) return null;
            Matcher matcher = TRUSTED_PATH_PATTERN.matcher(uri.getPath());
            if (!matcher.find()) {
                return null;
            }
            return UUID.fromString(matcher.group(1));
        } catch (IllegalArgumentException ex) {
            return null;
        }
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
        if (b.length >= 8 && new String(b, 4, 4, StandardCharsets.US_ASCII).equals("ftyp")) return "video/mp4";
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
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String normalized = name.replace('\\', '/');
        if (normalized.contains("../") || normalized.contains("/..") || normalized.startsWith("/")) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String base = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (base.isEmpty() || ".".equals(base) || "..".equals(base)) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String[] parts = base.toLowerCase(Locale.ROOT).split("\\.");
        for (int i = 1; i < parts.length; i++) {
            if (DANGEROUS_EXTENSIONS.contains(parts[i])) {
                throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
            }
        }
        String cleaned = base.replaceAll("[\\r\\n\"\\\\]", "_");
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }
}
