package com.workgo.payment.controller.admin;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.PayoutActionRequest;
import com.workgo.payment.dto.response.PayoutResponse;
import com.workgo.payment.enumeration.PayoutStatus;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.PayoutService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

//ADMIN xu ly lenh rut trong pilot (chuyen khoan thu cong); moi buoc co audit, khong co API sua so du
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/admin/payouts")
public class AdminPayoutController {

    PayoutService payoutService;

    @GetMapping
    ApiResponse<List<PayoutResponse>> getByStatus(
            @RequestParam(value = "status", defaultValue = "REQUESTED") PayoutStatus status
            ){
        return ApiResponse.<List<PayoutResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.getByStatus(status))
                .build();
    }

    @PostMapping("/{payoutId}/processing")
    ApiResponse<PayoutResponse> markProcessing(
            @PathVariable UUID payoutId,
            @RequestBody PayoutActionRequest request
            ){
        return ApiResponse.<PayoutResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.markProcessing(payoutId, request))
                .build();
    }

    @PostMapping("/{payoutId}/paid")
    ApiResponse<PayoutResponse> markPaid(
            @PathVariable UUID payoutId,
            @RequestBody PayoutActionRequest request
            ){
        return ApiResponse.<PayoutResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.markPaid(payoutId, request))
                .build();
    }

    @PostMapping("/{payoutId}/failed")
    ApiResponse<PayoutResponse> markFailed(
            @PathVariable UUID payoutId,
            @RequestBody PayoutActionRequest request
            ){
        return ApiResponse.<PayoutResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.markFailed(payoutId, request))
                .build();
    }

    @PostMapping("/{payoutId}/unknown")
    ApiResponse<PayoutResponse> markUnknown(
            @PathVariable UUID payoutId,
            @RequestBody PayoutActionRequest request
            ){
        return ApiResponse.<PayoutResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.markUnknown(payoutId, request))
                .build();
    }

}
