package com.workgo.trust.service;

import com.workgo.trust.entity.Dispute;
import com.workgo.trust.entity.PrivateEvidence;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.exception.AppException;
import com.workgo.trust.exception.DisputeNotFoundException;
import com.workgo.trust.exception.ErrorCode;
import com.workgo.trust.repository.DisputeRepository;
import com.workgo.trust.repository.PrivateEvidenceRepository;
import com.workgo.trust.service.storage.FileStorage;
import com.workgo.trust.service.storage.LocalFileStorage;
import com.workgo.trust.utils.TokenUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Private evidence service enforcing server-owned storage keys, magic-byte/polyglot verification,
 * checksum integrity, per-party case quota, 5-minute signed download URLs, and 90-day hold retention (D10 / DEV-07).
 */
@Service
public class PrivateEvidenceService {
    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final int MAX_FILES_PER_PARTY = 10;
    private static final Duration RETENTION_AFTER_CLOSE = Duration.ofDays(90);
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "html", "htm", "js", "mjs", "cjs", "php", "phtml", "exe", "dll", "bat", "cmd", "sh", "ps1", "jsp", "jspx", "svg", "xhtml"
    );

    private final PrivateEvidenceRepository files;
    private final DisputeRepository disputes;
    private final TokenUtils token;
    private final TrustTransactions tx;
    private final FileStorage storage;
    private final byte[] signingKey;
    private final String publicBase;

    public PrivateEvidenceService(PrivateEvidenceRepository files, DisputeRepository disputes, TokenUtils token, TrustTransactions tx,
                                  @Value("${app.storage.local-dir:./.workgo-storage/trust}") String localDir,
                                  @Value("${app.storage.signing-key:}") String key,
                                  @Value("${app.storage.public-base-url:/api/v1/trust}") String publicBase) {
        this(files, disputes, token, tx, new LocalFileStorage(localDir), key, publicBase);
    }

    @Autowired
    public PrivateEvidenceService(PrivateEvidenceRepository files, DisputeRepository disputes, TokenUtils token, TrustTransactions tx,
                                  FileStorage storage,
                                  @Value("${app.storage.signing-key:}") String key,
                                  @Value("${app.storage.public-base-url:/api/v1/trust}") String publicBase) {
        this.files = files;
        this.disputes = disputes;
        this.token = token;
        this.tx = tx;
        this.storage = storage;
        this.signingKey = key.getBytes(StandardCharsets.UTF_8);
        this.publicBase = publicBase.replaceAll("/+$", "");
    }

    public PrivateEvidence upload(UUID id, MultipartFile file) {
        return upload(id, file, null);
    }

    public PrivateEvidence upload(UUID id, MultipartFile file, String expectedSha256) {
        Dispute initial = load(id);
        participant(initial);
        if (file == null || file.isEmpty() || file.getSize() <= 0 || file.getSize() > MAX_BYTES) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String cleanOriginalName = validateAndCleanFilename(file.getOriginalFilename());
        byte[] content;
        try (var in = file.getInputStream()) {
            content = in.readNBytes((int) MAX_BYTES + 1);
        } catch (IOException e) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        if (content.length == 0 || content.length > MAX_BYTES) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String mime = detect(content);
        if (mime == null || !isDeclaredMimeCompatible(file.getContentType(), mime) || isPolyglotPayload(content, mime)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String sha = digest(content);
        if (expectedSha256 != null && !expectedSha256.isBlank()
                && !sha.equalsIgnoreCase(expectedSha256.trim())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return tx.locked(List.of("order:" + initial.getOrderId()), () -> {
            var d = load(id);
            participant(d);
            if (d.getDecisionId() != null || (d.getStatus() != DisputeStatus.OPEN && d.getStatus() != DisputeStatus.UNDER_REVIEW)) {
                throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            }
            UUID user = token.getCurrentUserId();
            var existing = files.findFirstByDisputeIdAndUploaderIdAndChecksumOrderByCreatedAtAsc(id, user, sha);
            if (existing.isPresent()) {
                PrivateEvidence prev = existing.get();
                if ("READY".equals(prev.getStatus()) && storage.exists(prev.getEffectiveStorageKey())) {
                    return prev;
                }
            }
            long readyCount = files.findByDisputeIdOrderByCreatedAtAsc(id).stream()
                    .filter(e -> user.equals(e.getUploaderId()) && "READY".equals(e.getStatus()))
                    .count();
            if (readyCount >= MAX_FILES_PER_PARTY) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            UUID fileId = UUID.randomUUID();
            String storageKey = fileId.toString();
            boolean stored = false;
            try {
                storage.put(storageKey, content, mime);
                stored = true;
                byte[] verified = storage.get(storageKey);
                if (verified == null || !digest(verified).equals(sha)) {
                    storage.delete(storageKey);
                    throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
                }
                PrivateEvidence entity = new PrivateEvidence(
                        fileId, id, user, mime, content.length, sha,
                        storageKey, cleanOriginalName, "READY", true,
                        Instant.now().plus(RETENTION_AFTER_CLOSE));
                return files.saveAndFlush(entity);
            } catch (RuntimeException ex) {
                if (stored) {
                    storage.delete(storageKey);
                }
                throw ex;
            }
        });
    }

    public List<PrivateEvidence> list(UUID id) {
        readAccess(load(id));
        return files.findByDisputeIdOrderByCreatedAtAsc(id).stream()
                .filter(e -> "READY".equals(e.getStatus()))
                .toList();
    }

    public record Download(String url, Instant expiresAt) {}

    public Download download(UUID fileId) {
        var file = files.findById(fileId).orElseThrow(() -> new AppException(ErrorCode.TARGET_NOT_FOUND));
        readAccess(load(file.getDisputeId()));
        if (!"READY".equals(file.getStatus()) || !storage.exists(file.getEffectiveStorageKey())) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        Instant expiry = Instant.now().plusSeconds(300);
        String signature = sign(fileId, expiry.getEpochSecond());
        return new Download(publicBase + "/evidence/" + fileId + "/content?expires=" + expiry.getEpochSecond() + "&signature=" + signature, expiry);
    }

    public record Content(byte[] bytes, String mime) {}

    public Content content(UUID id, long expires, String signature) {
        long now = Instant.now().getEpochSecond();
        if (expires <= now || expires > now + 300 || signature == null
                || !MessageDigest.isEqual(sign(id, expires).getBytes(StandardCharsets.US_ASCII), signature.getBytes(StandardCharsets.US_ASCII))) {
            throw new AccessDeniedException("Expired or invalid download");
        }
        var file = files.findById(id).orElseThrow(() -> new AppException(ErrorCode.TARGET_NOT_FOUND));
        readAccess(load(file.getDisputeId()));
        if (!"READY".equals(file.getStatus())) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        byte[] bytes = storage.get(file.getEffectiveStorageKey());
        if (bytes == null || !digest(bytes).equals(file.getChecksum())) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        return new Content(bytes, file.getMimeType());
    }

    public boolean canPurge(PrivateEvidence file, Instant caseClosedAt, Instant now) {
        if (file == null || file.isEvidenceHold() || caseClosedAt == null || now == null) {
            return false;
        }
        Instant minRetention = caseClosedAt.plus(RETENTION_AFTER_CLOSE);
        if (file.getRetentionUntil() != null && file.getRetentionUntil().isAfter(minRetention)) {
            minRetention = file.getRetentionUntil();
        }
        return !now.isBefore(minRetention);
    }

    public boolean purgeIfEligible(UUID fileId, Instant caseClosedAt, Instant now) {
        var file = files.findById(fileId).orElseThrow(() -> new AppException(ErrorCode.TARGET_NOT_FOUND));
        if (!canPurge(file, caseClosedAt, now)) {
            return false;
        }
        storage.delete(file.getEffectiveStorageKey());
        file.setStatus("UNAVAILABLE");
        files.saveAndFlush(file);
        return true;
    }

    private Dispute load(UUID id) {
        return disputes.findById(id).orElseThrow(DisputeNotFoundException::new);
    }

    private void participant(Dispute d) {
        if (!d.getClientId().equals(token.getCurrentUserId()) && !d.getProviderId().equals(token.getCurrentProviderIdOrNull())) {
            throw new AccessDeniedException("Participant required");
        }
    }

    private void readAccess(Dispute d) {
        if (token.hasRole("ROLE_ADMIN") && token.getCurrentUserId().equals(d.getAssignedAdminId())) {
            return;
        }
        participant(d);
    }

    private String sign(UUID id, long expiry) {
        if (signingKey.length < 32) throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((id + "|" + expiry).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
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
        if (b.length >= 5 && new String(b, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) return "application/pdf";
        return null;
    }

    private static boolean isDeclaredMimeCompatible(String declaredContentType, String detectedMime) {
        if (declaredContentType == null || declaredContentType.isBlank()) return true;
        String base = declaredContentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        if (base.isEmpty() || "application/octet-stream".equals(base) || "multipart/form-data".equals(base)) return true;
        if ("image/jpg".equals(base)) base = "image/jpeg";
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
        if ("image/png".equals(detectedMime) || "image/jpeg".equals(detectedMime)) {
            return sample.contains("javascript:") || sample.contains("onerror=") || sample.contains("onload=");
        }
        return false;
    }

    private static String validateAndCleanFilename(String name) {
        if (name == null || name.isBlank()) return "evidence";
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
        if (parts.length > 2) {
            for (int i = 1; i < parts.length; i++) {
                if (DANGEROUS_EXTENSIONS.contains(parts[i])) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
        } else if (parts.length == 2 && DANGEROUS_EXTENSIONS.contains(parts[1])) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String cleaned = base.replaceAll("[\\r\\n\"\\\\]", "_");
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }
}
