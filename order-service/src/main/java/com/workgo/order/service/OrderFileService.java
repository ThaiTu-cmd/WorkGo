package com.workgo.order.service;

import com.workgo.order.dto.response.FileDownloadUrlResponse;
import com.workgo.order.dto.response.StoredFileResponse;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.StoredFile;
import com.workgo.order.enumeration.FileContext;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.StoredFileMapper;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.StoredFileRepository;
import com.workgo.order.service.storage.FileStorage;
import com.workgo.order.service.storage.FileTypeDetector;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderFileService {

    static Duration LINK_TTL = Duration.ofMinutes(5);
    static Duration RETENTION_AFTER_CLOSE = Duration.ofDays(90);
    static int MAX_FILES_PER_CONTEXT = 20;

    static Map<FileContext, Long> MAX_SIZE = Map.of(
            FileContext.WORK_EVIDENCE, 10L * 1024 * 1024,
            FileContext.DELIVERY, 50L * 1024 * 1024);

    static Map<FileContext, Set<String>> ALLOWED_TYPES = Map.of(
            FileContext.WORK_EVIDENCE, Set.of("image/jpeg", "image/png", "image/webp"),
            FileContext.DELIVERY, Set.of("image/jpeg", "image/png", "image/webp", "application/pdf",
                    "application/zip", "video/mp4"));

    StoredFileRepository storedFileRepository;
    OrderRepository orderRepository;
    StoredFileMapper storedFileMapper;
    FileStorage fileStorage;
    FileTypeDetector fileTypeDetector;
    TokenUtils tokenUtils;
    byte[] signingKey;

    public OrderFileService(StoredFileRepository storedFileRepository,
                            OrderRepository orderRepository,
                            StoredFileMapper storedFileMapper,
                            FileStorage fileStorage,
                            FileTypeDetector fileTypeDetector,
                            TokenUtils tokenUtils,
                            @Value("${app.storage.signing-key:}") String signingKey) {
        this.storedFileRepository = storedFileRepository;
        this.orderRepository = orderRepository;
        this.storedFileMapper = storedFileMapper;
        this.fileStorage = fileStorage;
        this.fileTypeDetector = fileTypeDetector;
        this.tokenUtils = tokenUtils;
        this.signingKey = signingKey.isBlank() ? randomKey() : signingKey.getBytes(StandardCharsets.UTF_8);
    }

    public StoredFileResponse upload(UUID orderId, FileContext context, MultipartFile file) {
        return upload(orderId, context, file, null);
    }

    public StoredFileResponse upload(UUID orderId, FileContext context, MultipartFile file, String expectedSha256) {

        if (context == null) throw new AppException(ErrorCode.ORDER_FILE_CONTEXT_INVALID);
        if (file == null) throw new AppException(ErrorCode.ORDER_FILE_REQUIRED);
        if (!fileTypeDetector.isSafeFilename(file.getOriginalFilename())) {
            throw new AppException(ErrorCode.ORDER_FILE_TYPE_NOT_ALLOWED);
        }

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        assertIsProvider(order);

        byte[] content = readContent(file);

        if (content.length == 0) throw new AppException(ErrorCode.ORDER_FILE_EMPTY);
        if (content.length > MAX_SIZE.get(context)) throw new AppException(ErrorCode.ORDER_FILE_TOO_LARGE);

        String mimeType = fileTypeDetector.detect(content);
        if (mimeType == null || !ALLOWED_TYPES.get(context).contains(mimeType)
                || !fileTypeDetector.isDeclaredMimeCompatible(file.getContentType(), mimeType)) {
            throw new AppException(ErrorCode.ORDER_FILE_TYPE_NOT_ALLOWED);
        }

        String digest = sha256(content);
        if (expectedSha256 != null && !expectedSha256.isBlank()
                && !digest.equalsIgnoreCase(expectedSha256.trim())) {
            throw new AppException(ErrorCode.ORDER_FILE_TYPE_NOT_ALLOWED);
        }

        UUID currentUserId = tokenUtils.getCurrentUserId();
        var existing = storedFileRepository.findFirstByOrderIdAndContextAndUploadedByAndSha256OrderByCreatedAtAsc(
                orderId, context.name(), currentUserId, digest);
        if (existing != null && existing.isPresent()) {
            StoredFile prev = existing.get();
            if ("READY".equals(prev.getStatus()) && fileStorage.exists(prev.getStorageKey())) {
                return storedFileMapper.toStoredFileResponse(prev);
            }
        }

        long count = storedFileRepository.countByOrderIdAndContextAndUploadedBy(orderId, context.name(), currentUserId);
        if (count >= MAX_FILES_PER_CONTEXT) {
            throw new AppException(ErrorCode.ORDER_FILE_TOO_LARGE);
        }

        UUID storedFileId = UUID.randomUUID();
        String storageKey = orderId + "/" + storedFileId;
        boolean written = false;

        try {
            fileStorage.put(storageKey, content, mimeType);
            written = true;
            byte[] verified = fileStorage.get(storageKey);
            if (verified == null || !sha256(verified).equals(digest)) {
                fileStorage.delete(storageKey);
                throw new AppException(ErrorCode.ORDER_FILE_STORAGE_ERROR);
            }

            StoredFile storedFile = storedFileRepository.save(StoredFile.builder()
                    .storedFileId(storedFileId)
                    .orderId(orderId)
                    .context(context.name())
                    .uploadedBy(currentUserId)
                    .originalName(cleanName(file.getOriginalFilename()))
                    .mimeType(mimeType)
                    .sizeBytes((long) content.length)
                    .sha256(digest)
                    .storageKey(storageKey)
                    .status("READY")
                    .evidenceHold(context == FileContext.WORK_EVIDENCE)
                    .retentionUntil(Instant.now().plus(RETENTION_AFTER_CLOSE))
                    .build());

            return storedFileMapper.toStoredFileResponse(storedFile);
        } catch (RuntimeException ex) {
            if (written) {
                fileStorage.delete(storageKey);
            }
            throw ex;
        }
    }

    public FileDownloadUrlResponse createDownloadUrl(UUID orderId, UUID fileId) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);

        StoredFile storedFile = storedFileRepository.findById(fileId)
                .filter(file -> file.getOrderId().equals(orderId))
                .filter(file -> "READY".equals(file.getStatus()))
                .filter(file -> fileStorage.exists(file.getStorageKey()))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_FILE_NOT_FOUND));

        Instant expiresAt = Instant.now().plus(LINK_TTL);
        long expires = expiresAt.getEpochSecond();

        return FileDownloadUrlResponse.builder()
                .url("/orders/files/" + storedFile.getStoredFileId() + "/content?expires=" + expires
                        + "&signature=" + sign(storedFile.getStoredFileId(), expires))
                .expiresAt(expiresAt)
                .build();
    }

    //link co chu ky la bearer trong 5 phut, khong can token
    public StoredFile loadSignedFile(UUID fileId, long expires, String signature) {

        long now = Instant.now().getEpochSecond();
        boolean validSignature = signature != null && MessageDigest.isEqual(
                sign(fileId, expires).getBytes(StandardCharsets.US_ASCII),
                signature.getBytes(StandardCharsets.US_ASCII));

        if (!validSignature || now > expires || expires > now + LINK_TTL.toSeconds()) {
            throw new AppException(ErrorCode.ORDER_FILE_LINK_INVALID);
        }

        return storedFileRepository.findById(fileId)
                .filter(file -> "READY".equals(file.getStatus()))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_FILE_NOT_FOUND));
    }

    public byte[] readStoredContent(StoredFile storedFile) {
        if (storedFile == null || !"READY".equals(storedFile.getStatus())) {
            throw new AppException(ErrorCode.ORDER_FILE_NOT_FOUND);
        }
        byte[] content = fileStorage.get(storedFile.getStorageKey());
        if (content == null || !sha256(content).equals(storedFile.getSha256())) {
            throw new AppException(ErrorCode.ORDER_FILE_STORAGE_ERROR);
        }
        return content;
    }

    //bang chung/ban giao chi nhan file da upload vao dung don, dung loai, cua chinh nguoi gui va da READY
    public StoredFile loadOwnFile(UUID orderId, UUID fileId, FileContext context) {

        if (fileId == null) throw new AppException(ErrorCode.ORDER_FILE_REQUIRED);

        UUID currentUserId = tokenUtils.getCurrentUserId();

        return storedFileRepository.findById(fileId)
                .filter(file -> file.getOrderId().equals(orderId))
                .filter(file -> file.getContext().equals(context.name()))
                .filter(file -> file.getUploadedBy().equals(currentUserId))
                .filter(file -> "READY".equals(file.getStatus()))
                .filter(file -> {
                    try {
                        byte[] bytes = fileStorage.get(file.getStorageKey());
                        return bytes != null && bytes.length > 0 && sha256(bytes).equals(file.getSha256());
                    } catch (RuntimeException ex) {
                        return false;
                    }
                })
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_FILE_NOT_FOUND));
    }

    public boolean canPurge(StoredFile file, Instant orderOrCaseEndedAt, Instant now) {
        if (file == null || file.isEvidenceHold() || orderOrCaseEndedAt == null || now == null) {
            return false;
        }
        Instant minRetention = orderOrCaseEndedAt.plus(RETENTION_AFTER_CLOSE);
        if (file.getRetentionUntil() != null && file.getRetentionUntil().isAfter(minRetention)) {
            minRetention = file.getRetentionUntil();
        }
        return !now.isBefore(minRetention);
    }

    public boolean purgeIfEligible(UUID fileId, Instant orderOrCaseEndedAt, Instant now) {
        StoredFile file = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_FILE_NOT_FOUND));
        if (!canPurge(file, orderOrCaseEndedAt, now)) {
            return false;
        }
        fileStorage.delete(file.getStorageKey());
        file.setStatus("UNAVAILABLE");
        storedFileRepository.save(file);
        return true;
    }

    //=====================================

    private Order loadOrder(UUID orderId) {

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private void assertIsProvider(Order order) {

        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();

        if (providerId == null || !providerId.equals(order.getProviderId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private byte[] readContent(MultipartFile file) {

        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new AppException(ErrorCode.ORDER_FILE_STORAGE_ERROR);
        }
    }

    private String cleanName(String name) {

        if (name == null || name.isBlank()) return "file";

        String base = name.replace("\\", "/");
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\r\\n\"]", "_");

        return base.length() > 200 ? base.substring(0, 200) : base;
    }

    private String sha256(byte[] content) {

        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private String sign(UUID fileId, long expires) {

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((fileId + ":" + expires).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] randomKey() {

        log.warn("app.storage.signing-key is empty, using a random key: download links stop working after restart");

        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return key;
    }
}
