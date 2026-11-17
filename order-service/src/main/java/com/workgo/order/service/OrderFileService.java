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

        if (context == null) throw new AppException(ErrorCode.ORDER_FILE_CONTEXT_INVALID);
        if (file == null) throw new AppException(ErrorCode.ORDER_FILE_REQUIRED);

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        assertIsProvider(order);

        byte[] content = readContent(file);

        if (content.length == 0) throw new AppException(ErrorCode.ORDER_FILE_EMPTY);
        if (content.length > MAX_SIZE.get(context)) throw new AppException(ErrorCode.ORDER_FILE_TOO_LARGE);

        String mimeType = fileTypeDetector.detect(content);
        if (mimeType == null || !ALLOWED_TYPES.get(context).contains(mimeType)) {
            throw new AppException(ErrorCode.ORDER_FILE_TYPE_NOT_ALLOWED);
        }

        UUID storedFileId = UUID.randomUUID();
        String storageKey = orderId + "/" + storedFileId;

        fileStorage.put(storageKey, content);

        StoredFile storedFile = storedFileRepository.save(StoredFile.builder()
                .orderId(orderId)
                .context(context.name())
                .uploadedBy(tokenUtils.getCurrentUserId())
                .originalName(cleanName(file.getOriginalFilename()))
                .mimeType(mimeType)
                .sizeBytes((long) content.length)
                .sha256(sha256(content))
                .storageKey(storageKey)
                .build());

        return storedFileMapper.toStoredFileResponse(storedFile);
    }

    public FileDownloadUrlResponse createDownloadUrl(UUID orderId, UUID fileId) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);

        StoredFile storedFile = storedFileRepository.findById(fileId)
                .filter(file -> file.getOrderId().equals(orderId))
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

        boolean validSignature = signature != null && MessageDigest.isEqual(
                sign(fileId, expires).getBytes(StandardCharsets.US_ASCII),
                signature.getBytes(StandardCharsets.US_ASCII));

        if (!validSignature || Instant.now().getEpochSecond() > expires) {
            throw new AppException(ErrorCode.ORDER_FILE_LINK_INVALID);
        }

        return storedFileRepository.findById(fileId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_FILE_NOT_FOUND));
    }

    public byte[] readStoredContent(StoredFile storedFile) {

        return fileStorage.get(storedFile.getStorageKey());
    }

    //bang chung/ban giao chi nhan file da upload vao dung don, dung loai, cua chinh nguoi gui
    public StoredFile loadOwnFile(UUID orderId, UUID fileId, FileContext context) {

        if (fileId == null) throw new AppException(ErrorCode.ORDER_FILE_REQUIRED);

        UUID currentUserId = tokenUtils.getCurrentUserId();

        return storedFileRepository.findById(fileId)
                .filter(file -> file.getOrderId().equals(orderId))
                .filter(file -> file.getContext().equals(context.name()))
                .filter(file -> file.getUploadedBy().equals(currentUserId))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_FILE_NOT_FOUND));
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
