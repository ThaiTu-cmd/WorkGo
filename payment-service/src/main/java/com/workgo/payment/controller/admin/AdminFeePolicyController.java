package com.workgo.payment.controller.admin;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.FeePolicyCreationRequest;
import com.workgo.payment.dto.response.FeePolicyResponse;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.FeePolicyService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/admin/fee-policies")
public class AdminFeePolicyController {

    FeePolicyService feePolicyService;

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    ApiResponse<FeePolicyResponse> createVersion(
            @RequestBody FeePolicyCreationRequest request
            ){
        return ApiResponse.<FeePolicyResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(feePolicyService.createVersion(request))
                .build();
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping
    ApiResponse<List<FeePolicyResponse>> getVersions(){
        return ApiResponse.<List<FeePolicyResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(feePolicyService.getVersions())
                .build();
    }

}
