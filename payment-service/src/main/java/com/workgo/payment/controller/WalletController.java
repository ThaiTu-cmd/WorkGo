package com.workgo.payment.controller;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.PayoutCreationRequest;
import com.workgo.payment.dto.request.TopUpCreationRequest;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.dto.response.FeeAssessmentResponse;
import com.workgo.payment.dto.response.PayoutResponse;
import com.workgo.payment.dto.response.TopUpResponse;
import com.workgo.payment.dto.response.WalletResponse;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.FeeAssessmentService;
import com.workgo.payment.service.PayoutService;
import com.workgo.payment.service.TopUpService;
import com.workgo.payment.service.WalletOrderPaymentService;
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
@RequestMapping("/wallet")
public class WalletController {

    TopUpService topUpService;
    WalletOrderPaymentService walletOrderPaymentService;
    FeeAssessmentService feeAssessmentService;
    PayoutService payoutService;

    @GetMapping
    ApiResponse<WalletResponse> getMyWallet(){
        return ApiResponse.<WalletResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(topUpService.getMyWallet())
                .build();
    }

    @PostMapping("/top-ups")
    ApiResponse<TopUpResponse> createTopUp(
            @RequestBody TopUpCreationRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest
            ){
        return ApiResponse.<TopUpResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(topUpService.createTopUp(request, idempotencyKey, getClientIp(httpRequest)))
                .build();
    }

    @GetMapping("/top-ups")
    ApiResponse<List<TopUpResponse>> getMyTopUps(){
        return ApiResponse.<List<TopUpResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(topUpService.getMyTopUps())
                .build();
    }

    @GetMapping("/top-ups/{topUpId}")
    ApiResponse<TopUpResponse> getMyTopUp(
            @PathVariable UUID topUpId
            ){
        return ApiResponse.<TopUpResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(topUpService.getMyTopUp(topUpId))
                .build();
    }

    //rut tien ve ngan hang: tien chuyen sang cho chi, PAID chi khi ngan hang xac nhan
    @PostMapping("/payouts")
    ApiResponse<PayoutResponse> requestPayout(
            @RequestBody PayoutCreationRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
            ){
        return ApiResponse.<PayoutResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.requestPayout(request, idempotencyKey))
                .build();
    }

    @GetMapping("/payouts")
    ApiResponse<List<PayoutResponse>> getMyPayouts(){
        return ApiResponse.<List<PayoutResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.getMyPayouts())
                .build();
    }

    @PostMapping("/payouts/{payoutId}/cancel")
    ApiResponse<PayoutResponse> cancelPayout(
            @PathVariable UUID payoutId
            ){
        return ApiResponse.<PayoutResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(payoutService.cancel(payoutId))
                .build();
    }

    @GetMapping("/payouts/{payoutId}")
    ApiResponse<PayoutResponse> getPayout(@PathVariable UUID payoutId) {
        return ApiResponse.<PayoutResponse>builder().result(payoutService.getMyPayout(payoutId)).build();
    }

    @GetMapping("/payouts/receipt")
    ApiResponse<PayoutResponse> getPayoutReceipt(@RequestParam String key) {
        return ApiResponse.<PayoutResponse>builder().result(payoutService.getMyPayoutByKey(key)).build();
    }

    //phi minh phai chiu: da thu / con no (OUTSTANDING)
    @GetMapping("/fees")
    ApiResponse<List<FeeAssessmentResponse>> getMyFees(){
        return ApiResponse.<List<FeeAssessmentResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(feeAssessmentService.getMyFees())
                .build();
    }

    //client tra order bang so du vi, goi lai nhieu lan van chi tru 1 lan
    @PostMapping("/orders/{orderId}/pay")
    ApiResponse<EscrowAccountResponse> payOrder(
            @PathVariable UUID orderId
            ){
        return ApiResponse.<EscrowAccountResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(walletOrderPaymentService.payOrder(orderId))
                .build();
    }

    private String getClientIp(HttpServletRequest request) {

        String forwarded = request.getHeader("X-Forwarded-For");

        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

}
