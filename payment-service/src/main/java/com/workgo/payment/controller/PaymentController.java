package com.workgo.payment.controller;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.PaymentCreationRequest;
import com.workgo.payment.dto.response.PaymentResponse;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/payments")
public class PaymentController {

    PaymentService paymentService;

    @PostMapping
    ApiResponse<PaymentResponse> createPayment(
            @RequestBody PaymentCreationRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest
            ){
        return ApiResponse.<PaymentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(paymentService.createPayment(request, idempotencyKey, getClientIp(httpRequest)))
                .build();
    }

    @GetMapping("/{paymentId}")
    ApiResponse<PaymentResponse> getPayment(
            @PathVariable UUID paymentId
            ){
        return ApiResponse.<PaymentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(paymentService.getPayment(paymentId))
                .build();
    }

    @GetMapping
    ApiResponse<List<PaymentResponse>> getPaymentsOfOrder(
            @RequestParam(value = "orderId") UUID orderId
            ){
        return ApiResponse.<List<PaymentResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(paymentService.getPaymentsOfOrder(orderId))
                .build();
    }

    //qua api-gateway thi ip that nam o X-Forwarded-For (vnpay can vnp_IpAddr)
    private String getClientIp(HttpServletRequest request) {

        String forwarded = request.getHeader("X-Forwarded-For");

        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

}
