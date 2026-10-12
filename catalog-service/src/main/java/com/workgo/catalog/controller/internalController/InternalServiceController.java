package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceCreationRequest;
import com.workgo.catalog.dto.request.ServiceUpdateRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.ServiceService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/services")
public class ServiceController {

    ServiceService serviceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVIDER')")
    ApiResponse<ServiceCreationResponse> createService(
            @RequestBody ServiceCreationRequest request
    ) {
        return ApiResponse.<ServiceCreationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceService.createService(request))
                .build();
    }

    @GetMapping("/{serviceId}")
    ApiResponse<ServiceResponse> getService(
            @PathVariable UUID serviceId
    ) {
        return ApiResponse.<ServiceResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceService.getService(serviceId))
                .build();
    }

    @GetMapping("/my-services")
    @PreAuthorize("hasAnyRole('PROVIDER')")
    ApiResponse<PageResponse<ServiceResponse>> getMyServices(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<ServiceResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceService.getMyServices(page, size))
                .build();
    }

    @PutMapping("/{serviceId}")
    @PreAuthorize("hasAnyRole('PROVIDER')")
    ApiResponse<ServiceResponse> updateService(
            @PathVariable UUID serviceId,
            @RequestBody ServiceUpdateRequest request
    ) {
        return ApiResponse.<ServiceResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceService.updateService(serviceId, request))
                .build();
    }

    @DeleteMapping("/{serviceId}")
    @PreAuthorize("hasAnyRole('PROVIDER')")
    ApiResponse<Void> deleteService(
            @PathVariable UUID serviceId
    ) {
        serviceService.deleteService(serviceId);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }

}