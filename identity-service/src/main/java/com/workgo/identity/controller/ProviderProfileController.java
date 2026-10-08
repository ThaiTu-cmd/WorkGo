package com.workgo.identity.controller;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.ProviderProfileCreationRequest;
import com.workgo.identity.dto.request.ProviderProfileUpdateRequest;
import com.workgo.identity.dto.response.ProviderProfileResponse;
import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.service.ProviderProfileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/providers")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderProfileController {

    ProviderProfileService providerProfileService;

    // dang ki lam provider
    @PostMapping
    ApiResponse<ProviderProfileResponse> createProviderProfile(
            @RequestBody ProviderProfileCreationRequest request
    ) {
        return ApiResponse.<ProviderProfileResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerProfileService.createProviderProfile(request))
                .build();
    }

    //lay provider profile cua minh
    @GetMapping("/myProfile")
    ApiResponse<ProviderProfileResponse> getMyProviderProfile() {
        return ApiResponse.<ProviderProfileResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerProfileService.getMyProviderProfile())
                .build();
    }

    // lay profile theo id
    @GetMapping("/{providerId}")
    ApiResponse<ProviderProfileResponse> getProviderProfile(
            @PathVariable UUID providerId
    ) {
        return ApiResponse.<ProviderProfileResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerProfileService.getProviderProfile(providerId))
                .build();
    }

    // lay provider theo tieu chi
    @GetMapping
    ApiResponse<PageResponse<ProviderProfileResponse>> getProvidersByStatus(
            @RequestParam(value = "status", required = false) VerificationStatus status,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<ProviderProfileResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerProfileService.getProvidersByVerificationStatus(status, page, size))
                .build();
    }

    // cap nhat provider
    @PutMapping("/myProfile")
    ApiResponse<ProviderProfileResponse> updateMyProviderProfile(
            @RequestBody ProviderProfileUpdateRequest request
    ) {
        return ApiResponse.<ProviderProfileResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerProfileService.updateMyProviderProfile(request))
                .build();
    }

    // duyet provider (status)
    @PutMapping("/{providerId}/verification")
    ApiResponse<ProviderProfileResponse> updateVerificationStatus(
            @PathVariable UUID providerId,
            @RequestParam VerificationStatus status
    ) {
        return ApiResponse.<ProviderProfileResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerProfileService.updateVerificationStatus(providerId, status))
                .build();
    }

    // xoa provider
    @DeleteMapping("/myProfile")
    ApiResponse<Void> deleteMyProviderProfile() {
        providerProfileService.deleteMyProviderProfile();
        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }
}