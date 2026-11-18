package com.workgo.payment.controller.admin;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.ReconciliationActionRequest;
import com.workgo.payment.dto.request.TopUpResolveRequest;
import com.workgo.payment.dto.response.ReconciliationCase;
import com.workgo.payment.dto.response.TopUpResponse;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.ReconciliationService;
import com.workgo.payment.service.TopUpService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

//ADMIN doi soat: chi cac lenh da xac dinh an toan, giu nguyen ID/payload, co audit
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/admin/reconciliation")
public class AdminReconciliationController {

    ReconciliationService reconciliationService;
    TopUpService topUpService;

    @GetMapping
    ApiResponse<List<ReconciliationCase>> getCases(){
        return ApiResponse.<List<ReconciliationCase>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(reconciliationService.getCases())
                .build();
    }

    @PostMapping("/top-ups/{topUpId}/resolve")
    ApiResponse<TopUpResponse> resolveTopUp(
            @PathVariable UUID topUpId,
            @RequestBody TopUpResolveRequest request
            ){
        return ApiResponse.<TopUpResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(topUpService.resolveUnknown(topUpId, request))
                .build();
    }

    @PostMapping("/orders/{orderId}/retry-order-sync")
    ApiResponse<ReconciliationCase> retryOrderSync(
            @PathVariable UUID orderId,
            @RequestBody ReconciliationActionRequest request
            ){
        return ApiResponse.<ReconciliationCase>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(reconciliationService.retryOrderSync(orderId, request))
                .build();
    }

}
