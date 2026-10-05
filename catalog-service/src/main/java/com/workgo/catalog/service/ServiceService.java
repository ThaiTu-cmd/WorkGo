package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceCreationRequest;
import com.workgo.catalog.dto.request.ServiceUpdateRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.entity.Category;
import com.workgo.catalog.entity.Service;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.ServiceMapper;
import com.workgo.catalog.repository.CategoryRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.UUID;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceService {

    ServiceRepository serviceRepository;
    ServiceMapper serviceMapper;
    CategoryRepository categoryRepository;
    TokenUtils tokenUtils;

    public ServiceCreationResponse createService(ServiceCreationRequest request) {

        if (serviceRepository.existsBySlug(request.getSlug())) {
            throw new AppException(ErrorCode.SERVICE_EXISTED);
        }

        if (request.getCategoryId() == null) {
            throw new AppException(ErrorCode.CATEGORY_NOT_EXISTED);
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));


        UUID providerId = tokenUtils.getCurrentProviderId();

        Service service = Service.builder()
                .providerId(providerId)
                .category(category)
                .executionType(request.getExecutionType())
                .title(request.getTitle())
                .slug(request.getSlug())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .currency(request.getCurrency())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Service savedService = serviceRepository.save(service);

        return serviceMapper.toServiceCreationResponse(savedService);
    }

    public ServiceResponse getService(UUID serviceId) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        return serviceMapper.toServiceResponse(service);
    }

    public PageResponse<ServiceResponse> getMyServices(int page, int size) {
        UUID providerId = tokenUtils.getCurrentProviderId();

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = serviceRepository.findAllByProviderId(providerId, pageable);

        return PageResponse.<ServiceResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(serviceMapper::toServiceResponse)
                        .toList())
                .build();
    }


    public ServiceResponse updateService(UUID serviceId, ServiceUpdateRequest request) {

        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

//        UUID currentProviderId = getCurrentProviderId();
//        if (!service.getProviderId().equals(currentProviderId)) {
//            throw new AppException(ErrorCode.UNAUTHORIZED);
//        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
            service.setCategory(category);
        }

        serviceMapper.updateService(service, request);
        service.setUpdatedAt(Instant.now());

        Service savedService = serviceRepository.save(service);

        return serviceMapper.toServiceResponse(savedService);
    }

    public void deleteService(UUID serviceId) {

        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

//        UUID currentProviderId = getCurrentProviderId();
//        if (!service.getProviderId().equals(currentProviderId)) {
//            throw new AppException(ErrorCode.UNAUTHORIZED);
//        }

        int mark = Instant.now().getNano() * 1000;
        service.setIsDeleted(mark);

        serviceRepository.save(service);
    }

}