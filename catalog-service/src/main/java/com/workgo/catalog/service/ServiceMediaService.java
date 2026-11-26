package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceMediaCreationRequest;
import com.workgo.catalog.dto.request.ServiceMediaUpdateRequest;
import com.workgo.catalog.dto.response.ServiceMediaResponse;
import com.workgo.catalog.entity.Service;
import com.workgo.catalog.entity.ServiceMedia;
import com.workgo.catalog.enumeration.MediaType;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.ServiceMediaMapper;
import com.workgo.catalog.repository.ServiceMediaRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.service.storage.FileStorage;
import com.workgo.catalog.service.storage.FileTypeDetector;
import com.workgo.catalog.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceMediaService {

    static int MAX_MEDIA = 20;
    static Map<String, MediaType> ALLOWED_TYPES = Map.of(
            "image/jpeg", MediaType.IMAGE,
            "image/png", MediaType.IMAGE,
            "image/webp", MediaType.IMAGE,
            "video/mp4", MediaType.VIDEO);
    static Map<MediaType, Long> MAX_SIZE = Map.of(
            MediaType.IMAGE, 5L * 1024 * 1024,
            MediaType.VIDEO, 50L * 1024 * 1024);

    ServiceMediaRepository serviceMediaRepository;
    ServiceMediaMapper serviceMediaMapper;
    ServiceRepository serviceRepository;
    TokenUtils tokenUtils;
    FileStorage fileStorage;
    FileTypeDetector fileTypeDetector;

    @PreAuthorize("hasAnyRole('PROVIDER')")
    public ServiceMediaResponse createServiceMedia(UUID serviceId, ServiceMediaCreationRequest request) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(service);
        assertHttpsUrl(request.getUrl());

        if (serviceMediaRepository.existsByService_ServiceIdAndUrl(serviceId, request.getUrl())) {
            throw new AppException(ErrorCode.MEDIA_EXISTED);
        }

        ServiceMedia serviceMedia = ServiceMedia.builder()
                .url(request.getUrl())
                .mediaType(request.getMediaType())
                .cover(request.isCover())
                .status("READY")
                .service(service)
                .build();

        ServiceMedia savedMedia = serviceMediaRepository.save(serviceMedia);

        return serviceMediaMapper.toServiceMediaResponse(savedMedia);
    }

    public PageResponse<ServiceMediaResponse> getServiceMediaByService(UUID serviceId, int page, int size) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ServiceMedia> pageData = serviceMediaRepository.findAllByService_ServiceId(serviceId, pageable);

        return PageResponse.<ServiceMediaResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream().map(serviceMediaMapper::toServiceMediaResponse).toList())
                .build();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('PROVIDER')")
    public ServiceMediaResponse uploadServiceMedia(UUID serviceId, MultipartFile file, boolean cover) {
        return uploadServiceMedia(serviceId, file, cover, null);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('PROVIDER')")
    public ServiceMediaResponse uploadServiceMedia(UUID serviceId, MultipartFile file, boolean cover, String expectedSha256) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(service);

        if (file == null) throw new AppException(ErrorCode.FILE_REQUIRED);
        if (!fileTypeDetector.isSafeFilename(file.getOriginalFilename())) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        byte[] content = readContent(file);
        if (content.length == 0) throw new AppException(ErrorCode.FILE_EMPTY);

        String mimeType = fileTypeDetector.detect(content);
        MediaType mediaType = mimeType == null ? null : ALLOWED_TYPES.get(mimeType);
        if (mediaType == null || !fileTypeDetector.isDeclaredMimeCompatible(file.getContentType(), mimeType)) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }
        if (content.length > MAX_SIZE.get(mediaType)) throw new AppException(ErrorCode.FILE_TOO_LARGE);

        String digest = sha256(content);
        if (expectedSha256 != null && !expectedSha256.isBlank()
                && !digest.equalsIgnoreCase(expectedSha256.trim())) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        var existing = serviceMediaRepository.findFirstByService_ServiceIdAndSha256OrderByCreatedAtAsc(serviceId, digest);
        if (existing != null && existing.isPresent()) {
            ServiceMedia prev = existing.get();
            if ("READY".equals(prev.getStatus()) && prev.getStorageKey() != null && fileStorage.exists(prev.getStorageKey())) {
                return serviceMediaMapper.toServiceMediaResponse(prev);
            }
        }

        if (serviceMediaRepository.countByService_ServiceId(serviceId) >= MAX_MEDIA) {
            throw new AppException(ErrorCode.MEDIA_LIMIT);
        }

        String storageKey = "services/" + serviceId + "/" + UUID.randomUUID();
        boolean written = false;

        try {
            fileStorage.put(storageKey, content, mimeType);
            written = true;
            byte[] verified = fileStorage.get(storageKey);
            if (verified == null || !sha256(verified).equals(digest)) {
                fileStorage.delete(storageKey);
                throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
            }

            ServiceMedia serviceMedia = serviceMediaRepository.save(ServiceMedia.builder()
                    .mediaType(mediaType)
                    .cover(cover)
                    .storageKey(storageKey)
                    .mimeType(mimeType)
                    .sizeBytes((long) content.length)
                    .sha256(digest)
                    .status("READY")
                    .service(service)
                    .build());

            serviceMedia.setUrl("/medias/" + serviceMedia.getServiceMediaId() + "/content");

            return serviceMediaMapper.toServiceMediaResponse(serviceMediaRepository.save(serviceMedia));
        } catch (RuntimeException ex) {
            if (written) {
                fileStorage.delete(storageKey);
            }
            throw ex;
        }
    }

    public ServiceMedia loadUploadedMedia(UUID mediaId) {

        return serviceMediaRepository.findById(mediaId)
                .filter(media -> media.getStorageKey() != null)
                .filter(media -> "READY".equals(media.getStatus()))
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));
    }

    public byte[] readStoredContent(ServiceMedia serviceMedia) {
        if (serviceMedia == null || !"READY".equals(serviceMedia.getStatus())) {
            throw new AppException(ErrorCode.MEDIA_NOT_EXISTED);
        }
        byte[] content = fileStorage.get(serviceMedia.getStorageKey());
        if (content == null || (serviceMedia.getSha256() != null && !sha256(content).equals(serviceMedia.getSha256()))) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
        return content;
    }

    public ServiceMediaResponse getServiceMedia(UUID mediaId) {
        ServiceMedia serviceMedia = serviceMediaRepository.findById(mediaId)
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));

        return serviceMediaMapper.toServiceMediaResponse(serviceMedia);
    }

    @PreAuthorize("hasAnyRole('PROVIDER')")
    public ServiceMediaResponse updateServiceMedia(UUID mediaId, ServiceMediaUpdateRequest request) {
        ServiceMedia serviceMedia = serviceMediaRepository.findById(mediaId)
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));

        tokenUtils.assertServiceOwner(serviceMedia.getService());

        if (request.getUrl() != null) {
            if (serviceMedia.getStorageKey() != null) throw new AppException(ErrorCode.MEDIA_URL_INVALID);
            assertHttpsUrl(request.getUrl());
        }

        serviceMediaMapper.updateMediaService(serviceMedia, request);

        ServiceMedia saveMedia = serviceMediaRepository.save(serviceMedia);

        return serviceMediaMapper.toServiceMediaResponse(saveMedia);
    }

    @PreAuthorize("hasAnyRole('PROVIDER')")
    public void deleteServiceMedia(UUID mediaId) {

        ServiceMedia serviceMedia = serviceMediaRepository.findById(mediaId)
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));

        tokenUtils.assertServiceOwner(serviceMedia.getService());

        serviceMedia.setIsDeleted(tokenUtils.createDeletedMark());

        serviceMediaRepository.save(serviceMedia);

    }

    //=====================================

    //chan javascript:, data:, http: khi user tu dan link anh ngoai
    private void assertHttpsUrl(String url) {

        if (url == null || !url.regionMatches(true, 0, "https://", 0, 8) || url.length() > 2048) {
            throw new AppException(ErrorCode.MEDIA_URL_INVALID);
        }
    }

    private byte[] readContent(MultipartFile file) {

        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    private String sha256(byte[] content) {

        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
