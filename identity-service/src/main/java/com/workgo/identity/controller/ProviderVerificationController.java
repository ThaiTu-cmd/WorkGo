package com.workgo.identity.controller;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.ProviderVerificationCreationRequest;
import com.workgo.identity.dto.request.ProviderVerificationReviewRequest;
import com.workgo.identity.dto.response.ProviderVerificationResponse;
import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.service.ProviderVerificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/provider-verifications")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderVerificationController {

    ProviderVerificationService providerVerificationService;

    // tao ho so cho provider
    @PostMapping
    ApiResponse<ProviderVerificationResponse> submitVerification(
            @RequestBody ProviderVerificationCreationRequest request
    ) {
        return ApiResponse.<ProviderVerificationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerVerificationService.createVerification(request))
                .build();
    }

    //xem ho so cua toi
    @GetMapping("/my")
    ApiResponse<PageResponse<ProviderVerificationResponse>> getMyVerifications(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<ProviderVerificationResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerVerificationService.getMyVerifications(page, size))
                .build();
    }

    //xem chi tiet 1 ho so bang id
    @GetMapping("/{verificationId}")
    ApiResponse<ProviderVerificationResponse> getVerification(
            @PathVariable UUID verificationId
    ) {
        return ApiResponse.<ProviderVerificationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerVerificationService.getVerification(verificationId))
                .build();
    }

    // lay ho so theo status
    @GetMapping
    ApiResponse<PageResponse<ProviderVerificationResponse>> getVerificationsByStatus(
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") VerificationStatus status,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<ProviderVerificationResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerVerificationService.getVerificationsByStatus(status, page, size))
                .build();
    }

    // admin duyet ho so qua verification status
    @PutMapping("/{verificationId}/review")
    ApiResponse<ProviderVerificationResponse> reviewVerification(
            @PathVariable UUID verificationId,
            @RequestBody ProviderVerificationReviewRequest request
    ) {
        return ApiResponse.<ProviderVerificationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(providerVerificationService.reviewVerification(verificationId, request))
                .build();
    }

    // xoa ho so soft delete
    @DeleteMapping("/{verificationId}")
    ApiResponse<Void> deleteVerification(@PathVariable UUID verificationId) {
        providerVerificationService.deleteVerification(verificationId);
        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }
}