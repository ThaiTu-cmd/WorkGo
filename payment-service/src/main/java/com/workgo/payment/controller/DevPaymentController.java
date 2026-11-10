package com.workgo.payment.controller;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.response.PaymentResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.PaymentRepository;
import com.workgo.payment.service.PaymentCallbackService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("dev")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/dev/payments")
public class DevPaymentController {

    PaymentCallbackService paymentCallbackService;
    PaymentRepository paymentRepository;

    @RequestMapping(value = "/{paymentCode}/success", method = {RequestMethod.GET, RequestMethod.POST})
    ApiResponse<PaymentResponse> success(@PathVariable String paymentCode) {

        return ApiResponse.<PaymentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(paymentCallbackService.handle(mockResult(paymentCode, true)))
                .build();
    }

    @RequestMapping(value = "/{paymentCode}/fail", method = {RequestMethod.GET, RequestMethod.POST})
    ApiResponse<PaymentResponse> fail(@PathVariable String paymentCode) {

        return ApiResponse.<PaymentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(paymentCallbackService.handle(mockResult(paymentCode, false)))
                .build();
    }

    private GatewayCallbackResult mockResult(String paymentCode, boolean success) {

        return GatewayCallbackResult.builder()
                .paymentCode(paymentCode)
                .success(success)
                .amount(paymentRepository.findByPaymentCode(paymentCode)
                        .map(Payment::getAmount)
                        .orElse(null))
                .gatewayTxnId("MOCK-" + paymentCode)
                .failureCode(success ? null : "MOCK_FAILED")
                .failureMessage(success ? null : "Mock payment failed")
                .build();
    }

}
