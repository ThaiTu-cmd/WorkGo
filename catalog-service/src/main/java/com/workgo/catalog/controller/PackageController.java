package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.PackageCreationRequest;
import com.workgo.catalog.dto.request.PackageUpdateRequest;
import com.workgo.catalog.dto.response.PackageResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.PackageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/packages")
public class PackageController {

    PackageService packageService;

    // tao package cho service
    @PostMapping("/services/{serviceId}")
    ApiResponse<PackageResponse> createPackage(
            @PathVariable UUID serviceId,
            @RequestBody PackageCreationRequest request
    ) {
        return ApiResponse.<PackageResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(packageService.createPackage(serviceId, request))
                .build();
    }

    //lay tat ca package cua 1 service
    @GetMapping("/services/{serviceId}")
    ApiResponse<PageResponse<PackageResponse>> getPackagesByService(
            @PathVariable UUID serviceId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<PackageResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(packageService.getPackagesByService(serviceId, page, size))
                .build();
    }

    //lay mot package cu the
    @GetMapping("/{packageId}")
    ApiResponse<PackageResponse> getPackage(
            @PathVariable UUID packageId
    ) {
        return ApiResponse.<PackageResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(packageService.getPackage(packageId))
                .build();
    }

    // cap nhat 1 package
    @PutMapping("/{packageId}")
    ApiResponse<PackageResponse> updatePackage(
            @PathVariable UUID packageId,
            @RequestBody PackageUpdateRequest request
    ) {
        return ApiResponse.<PackageResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(packageService.updatePackage(packageId, request))
                .build();
    }

    //soft delete 1 package
    @DeleteMapping("/{packageId}")
    ApiResponse<Void> deletePackage(
            @PathVariable UUID packageId
    ) {
        packageService.deletePackage(packageId);
        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }

}