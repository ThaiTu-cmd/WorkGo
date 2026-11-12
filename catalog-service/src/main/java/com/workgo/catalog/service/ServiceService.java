package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceCreationRequest;
import com.workgo.catalog.dto.request.ServiceStatusUpdateRequest;
import com.workgo.catalog.dto.request.ServiceUpdateRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.entity.Category;
import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.ExecutionType;
import com.workgo.catalog.enumeration.ServiceStatus;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.ServiceMapper;
import com.workgo.catalog.repository.CategoryRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

        tokenUtils.assertServiceOwner(service);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
            service.setCategory(category);
        }

        serviceMapper.updateService(service, request);

        if (service.getStatus() == ServiceStatus.PUBLISHED && service.getPublishedAt() == null) {
            service.setPublishedAt(Instant.now());
        }

        service.setUpdatedAt(Instant.now());

        Service savedService = serviceRepository.save(service);

        return serviceMapper.toServiceResponse(savedService);
    }

    public void deleteService(UUID serviceId) {

        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(service);

        int mark = Instant.now().getNano() * 1000;
        service.setIsDeleted(mark);

        serviceRepository.save(service);
    }

    public ServiceResponse updateServiceStatus(UUID serviceId, ServiceStatusUpdateRequest request) {

        if (request.getStatus() == null) {
            throw new AppException(ErrorCode.INVALID_SERVICE_STATUS);
        }

        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(service);

        service.setStatus(request.getStatus());

        if (request.getStatus() == ServiceStatus.PUBLISHED && service.getPublishedAt() == null) {
            service.setPublishedAt(Instant.now());
        }

        service.setUpdatedAt(Instant.now());

        Service savedService = serviceRepository.save(service);

        return serviceMapper.toServiceResponse(savedService);
    }

    public PageResponse<ServiceResponse> getServices(String keyword,
                                                     UUID categoryId,
                                                     ExecutionType executionType,
                                                     BigDecimal minPrice,
                                                     BigDecimal maxPrice,
                                                     int page,
                                                     int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Service> pageData = serviceRepository.findAll(
                buildServiceFilter(keyword, categoryId, executionType, minPrice, maxPrice),
                pageable
        );

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

    private Specification<Service> buildServiceFilter(String keyword,
                                                      UUID categoryId,
                                                      ExecutionType executionType,
                                                      BigDecimal minPrice,
                                                      BigDecimal maxPrice) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("status"), ServiceStatus.PUBLISHED));

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("categoryId"), categoryId));
            }

            if (executionType != null) {
                predicates.add(cb.equal(root.get("executionType"), executionType));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}