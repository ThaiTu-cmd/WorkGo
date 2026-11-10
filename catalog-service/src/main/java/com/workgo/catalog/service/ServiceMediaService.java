package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceMediaCreationRequest;
import com.workgo.catalog.dto.request.ServiceMediaUpdateRequest;
import com.workgo.catalog.dto.response.ServiceMediaResponse;
import com.workgo.catalog.entity.Service;
import com.workgo.catalog.entity.ServiceMedia;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.ServiceMediaMapper;
import com.workgo.catalog.repository.ServiceMediaRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceMediaService {

    ServiceMediaRepository serviceMediaRepository;
    ServiceMediaMapper serviceMediaMapper;
    ServiceRepository serviceRepository;
    TokenUtils tokenUtils;

    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ServiceMediaResponse createServiceMedia(UUID serviceId, ServiceMediaCreationRequest request) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        if(serviceMediaRepository.existsByService_ServiceIdAndUrl(serviceId, request.getUrl())){
            throw new AppException(ErrorCode.MEDIA_EXISTED);
        }

        ServiceMedia serviceMedia = ServiceMedia.builder()
                .url(request.getUrl())
                .mediaType(request.getMediaType())
                .cover(request.isCover())
                .service(service)
                .build();

        ServiceMedia savedMedia = serviceMediaRepository.save(serviceMedia);

        return serviceMediaMapper.toServiceMediaResponse(savedMedia);
    }

    public PageResponse<ServiceMediaResponse> getServiceMediaByService(UUID serviceId, int page, int size) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page,size, sort);

        Page<ServiceMedia> pageData = serviceMediaRepository.findAllByService_ServiceId(serviceId, pageable);

        return PageResponse.<ServiceMediaResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream().map(serviceMediaMapper::toServiceMediaResponse).toList())
                .build();
    }

    public ServiceMediaResponse getServiceMedia(UUID mediaId) {
        ServiceMedia serviceMedia = serviceMediaRepository.findById(mediaId)
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));

        return serviceMediaMapper.toServiceMediaResponse(serviceMedia);
    }

    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ServiceMediaResponse updateServiceMedia(UUID mediaId, ServiceMediaUpdateRequest request) {
        ServiceMedia serviceMedia = serviceMediaRepository.findById(mediaId)
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));

        serviceMediaMapper.updateMediaService(serviceMedia, request);

        ServiceMedia saveMedia = serviceMediaRepository.save(serviceMedia);

        return serviceMediaMapper.toServiceMediaResponse(saveMedia);
    }

    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public void deleteServiceMedia(UUID mediaId) {

        ServiceMedia serviceMedia = serviceMediaRepository.findById(mediaId)
                .orElseThrow(() -> new AppException(ErrorCode.MEDIA_NOT_EXISTED));

        serviceMedia.setIsDeleted(tokenUtils.createDeletedMark());

        serviceMediaRepository.save(serviceMedia);

    }

}