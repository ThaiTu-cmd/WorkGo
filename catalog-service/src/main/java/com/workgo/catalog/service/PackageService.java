package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.PackageCreationRequest;
import com.workgo.catalog.dto.request.PackageUpdateRequest;
import com.workgo.catalog.dto.response.PackageResponse;
import com.workgo.catalog.entity.Package;
import com.workgo.catalog.entity.Service;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.PackageMapper;
import com.workgo.catalog.repository.PackageRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.UUID;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class PackageService {

    PackageRepository packageRepository;
    PackageMapper packageMapper;
    ServiceRepository serviceRepository;
    TokenUtils tokenUtils;


    @PreAuthorize("hasAnyRole('PROVIDER')")
    public PackageResponse createPackage(UUID serviceId, PackageCreationRequest request) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        if (packageRepository.existsByService_ServiceIdAndName(serviceId, request.getName()))
            throw new AppException(ErrorCode.PACKAGE_EXISTED);

        Package pkg = Package.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .currency(request.getCurrency())
                .deliveryDay(request.getDeliveryDay())
                .durationMinute(request.getDurationMinute())
                .revisionLimit(request.getRevisionLimit())
                .service(service)
                .build();

        return packageMapper.toPackageResponse(packageRepository.save(pkg));
    }

    public PageResponse<PackageResponse> getPackagesByService(UUID serviceId, int page, int size) {
        serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = packageRepository.findAllByService_ServiceId(serviceId, pageable);

        return PageResponse.<PackageResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream().map(packageMapper::toPackageResponse).toList())
                .build();
    }

    public PackageResponse getPackage(UUID packageId) {
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_EXISTED));

        return packageMapper.toPackageResponse(pkg);
    }

    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public PackageResponse updatePackage(UUID packageId, PackageUpdateRequest request) {
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_EXISTED));

        packageMapper.updatePackage(pkg, request);
        pkg.setUpdatedAt(Instant.now());

        return packageMapper.toPackageResponse(packageRepository.save(pkg));
    }

    @PreAuthorize("hasAnyRole('PROVIDER')")
    public void deletePackage(UUID packageId) {
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.PACKAGE_NOT_EXISTED));

        pkg.setIsDeleted(tokenUtils.createDeletedMark());
        packageRepository.save(pkg);
    }

}