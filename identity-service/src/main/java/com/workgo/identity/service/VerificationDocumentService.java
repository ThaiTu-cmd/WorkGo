package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.VerificationDocumentMapper;
import com.workgo.identity.dto.response.FileDownloadUrlResponse;
import com.workgo.identity.dto.response.VerificationDocumentResponse;
import com.workgo.identity.entity.ProviderVerification;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.VerificationDocument;
import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.repository.ProviderVerificationRepository;
import com.workgo.identity.repository.VerificationDocumentRepository;
import com.workgo.identity.service.storage.FileStorage;
import com.workgo.identity.service.storage.FileTypeDetector;
import com.workgo.identity.util.AttributeUtil;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
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
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class VerificationDocumentService {

    static Duration LINK_TTL = Duration.ofMinutes(5);
    static long MAX_SIZE = 10L * 1024 * 1024;
    static int MAX_DOCUMENTS = 5;
    static Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "application/pdf");

    VerificationDocumentRepository verificationDocumentRepository;
    ProviderVerificationRepository providerVerificationRepository;
    VerificationDocumentMapper verificationDocumentMapper;
    FileStorage fileStorage;
    FileTypeDetector fileTypeDetector;
    AttributeUtil attributeUtil;
    byte[] signingKey;

    public VerificationDocumentService(VerificationDocumentRepository verificationDocumentRepository,
                                       ProviderVerificationRepository providerVerificationRepository,
                                       VerificationDocumentMapper verificationDocumentMapper,
                                       FileStorage fileStorage,
                                       FileTypeDetector fileTypeDetector,
                                       AttributeUtil attributeUtil,
                                       @Value("${app.storage.signing-key:}") String signingKey) {
        this.verificationDocumentRepository = verificationDocumentRepository;
        this.providerVerificationRepository = providerVerificationRepository;
        this.verificationDocumentMapper = verificationDocumentMapper;
        this.fileStorage = fileStorage;
        this.fileTypeDetector = fileTypeDetector;
        this.attributeUtil = attributeUtil;
        this.signingKey = signingKey.isBlank() ? randomKey() : signingKey.getBytes(StandardCharsets.UTF_8);
    }

    public VerificationDocumentResponse upload(UUID verificationId, MultipartFile file) {
        return upload(verificationId, file, null);
    }

    public VerificationDocumentResponse upload(UUID verificationId, MultipartFile file, String expectedSha256) {

        if (file == null) throw new AppException(ErrorCode.FILE_REQUIRED);
        if (!fileTypeDetector.isSafeFilename(file.getOriginalFilename())) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        ProviderVerification verification = loadVerification(verificationId);
        User owner = assertOwner(verification);

        if (verification.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new AppException(ErrorCode.VERIFICATION_NOT_EDITABLE);
        }

        byte[] content = readContent(file);

        if (content.length == 0) throw new AppException(ErrorCode.FILE_EMPTY);
        if (content.length > MAX_SIZE) throw new AppException(ErrorCode.FILE_TOO_LARGE);

        String mimeType = fileTypeDetector.detect(content);
        if (mimeType == null || !ALLOWED_TYPES.contains(mimeType)
                || !fileTypeDetector.isDeclaredMimeCompatible(file.getContentType(), mimeType)) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        String digest = sha256(content);
        if (expectedSha256 != null && !expectedSha256.isBlank()
                && !digest.equalsIgnoreCase(expectedSha256.trim())) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        var existing = verificationDocumentRepository
                .findFirstByVerification_ProviderVerificationIdAndSha256OrderByCreatedAtAsc(verificationId, digest);
        if (existing != null && existing.isPresent()) {
            VerificationDocument prev = existing.get();
            if ("READY".equals(prev.getStatus()) && fileStorage.exists(prev.getStorageKey())) {
                return verificationDocumentMapper.toVerificationDocumentResponse(prev);
            }
        }

        if (verificationDocumentRepository.countByVerification_ProviderVerificationId(verificationId) >= MAX_DOCUMENTS) {
            throw new AppException(ErrorCode.VERIFICATION_DOCUMENT_LIMIT);
        }

        String storageKey = "verifications/" + verificationId + "/" + UUID.randomUUID();
        boolean written = false;

        try {
            fileStorage.put(storageKey, content);
            written = true;
            byte[] verified = fileStorage.get(storageKey);
            if (verified == null || !sha256(verified).equals(digest)) {
                fileStorage.delete(storageKey);
                throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
            }

            VerificationDocument document = verificationDocumentRepository.save(VerificationDocument.builder()
                    .verification(verification)
                    .uploadedBy(owner.getUserId())
                    .originalName(cleanName(file.getOriginalFilename()))
                    .mimeType(mimeType)
                    .sizeBytes((long) content.length)
                    .sha256(digest)
                    .storageKey(storageKey)
                    .status("READY")
                    .build());

            return verificationDocumentMapper.toVerificationDocumentResponse(document);
        } catch (RuntimeException ex) {
            if (written) {
                fileStorage.delete(storageKey);
            }
            throw ex;
        }
    }

    public List<VerificationDocumentResponse> getDocuments(UUID verificationId) {

        assertOwnerOrSuperAdmin(loadVerification(verificationId));

        return verificationDocumentRepository.findAllByVerification_ProviderVerificationIdOrderByCreatedAtAsc(verificationId)
                .stream()
                .filter(doc -> "READY".equals(doc.getStatus()))
                .map(verificationDocumentMapper::toVerificationDocumentResponse)
                .toList();
    }

    public FileDownloadUrlResponse createDownloadUrl(UUID verificationId, UUID documentId) {

        assertOwnerOrSuperAdmin(loadVerification(verificationId));

        VerificationDocument document = verificationDocumentRepository.findById(documentId)
                .filter(doc -> doc.getVerification().getProviderVerificationId().equals(verificationId))
                .filter(doc -> "READY".equals(doc.getStatus()))
                .filter(doc -> fileStorage.exists(doc.getStorageKey()))
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        Instant expiresAt = Instant.now().plus(LINK_TTL);
        long expires = expiresAt.getEpochSecond();

        return FileDownloadUrlResponse.builder()
                .url("/provider-verifications/documents/" + document.getVerificationDocumentId()
                        + "/content?expires=" + expires + "&signature=" + sign(document.getVerificationDocumentId(), expires))
                .expiresAt(expiresAt)
                .build();
    }

    //link co chu ky la bearer trong 5 phut, khong can token
    public VerificationDocument loadSignedDocument(UUID documentId, long expires, String signature) {

        long now = Instant.now().getEpochSecond();
        boolean validSignature = signature != null && MessageDigest.isEqual(
                sign(documentId, expires).getBytes(StandardCharsets.US_ASCII),
                signature.getBytes(StandardCharsets.US_ASCII));

        if (!validSignature || now > expires || expires > now + LINK_TTL.toSeconds()) {
            throw new AppException(ErrorCode.FILE_LINK_INVALID);
        }

        return verificationDocumentRepository.findById(documentId)
                .filter(doc -> "READY".equals(doc.getStatus()))
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));
    }

    public byte[] readStoredContent(VerificationDocument document) {
        if (document == null || !"READY".equals(document.getStatus())) {
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }
        byte[] content = fileStorage.get(document.getStorageKey());
        if (content == null || !sha256(content).equals(document.getSha256())) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
        return content;
    }

    /** KYC documents are subject to separate mandatory identity retention and never purged under the 90-day order/case rule (DEV-07). */
    public boolean canPurgeUnderCaseRetention(VerificationDocument document) {
        return false;
    }

    //=====================================

    private ProviderVerification loadVerification(UUID verificationId) {

        return providerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_VERIFICATION_NOT_EXISTED));
    }

    private User assertOwner(ProviderVerification verification) {

        User user = attributeUtil.getCurrentUser();

        if (!verification.getProviderProfile().getUser().getUserId().equals(user.getUserId())) {
            throw new AppException(ErrorCode.PROVIDER_VERIFICATION_NOT_EXISTED);
        }

        return user;
    }

    private void assertOwnerOrSuperAdmin(ProviderVerification verification) {

        boolean superAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));

        if (!superAdmin) assertOwner(verification);
    }

    private byte[] readContent(MultipartFile file) {

        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
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

    private String sign(UUID documentId, long expires) {

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((documentId + ":" + expires).getBytes(StandardCharsets.UTF_8)));
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
