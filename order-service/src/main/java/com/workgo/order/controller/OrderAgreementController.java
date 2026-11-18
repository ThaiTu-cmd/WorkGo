package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.AmendmentCreationRequest;
import com.workgo.order.dto.request.AmendmentRespondRequest;
import com.workgo.order.dto.response.OrderAgreementVersionResponse;
import com.workgo.order.dto.response.OrderAmendmentResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.OrderAgreementService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderAgreementController {

    OrderAgreementService orderAgreementService;

    @GetMapping("/{orderId}/agreement")
    ApiResponse<List<OrderAgreementVersionResponse>> getAgreementVersions(@PathVariable UUID orderId) {

        return ApiResponse.<List<OrderAgreementVersionResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderAgreementService.getAgreementVersions(orderId))
                .build();
    }

    @GetMapping("/{orderId}/amendments")
    ApiResponse<List<OrderAmendmentResponse>> getAmendments(@PathVariable UUID orderId) {

        return ApiResponse.<List<OrderAmendmentResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderAgreementService.getAmendments(orderId))
                .build();
    }

    @PostMapping("/{orderId}/amendments")
    ApiResponse<OrderAmendmentResponse> propose(
            @PathVariable UUID orderId,
            @RequestBody AmendmentCreationRequest request
    ) {
        return ApiResponse.<OrderAmendmentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderAgreementService.propose(orderId, request))
                .build();
    }

    @PostMapping("/{orderId}/amendments/{amendmentId}/accept")
    ApiResponse<OrderAmendmentResponse> accept(
            @PathVariable UUID orderId,
            @PathVariable UUID amendmentId,
            @RequestBody(required = false) AmendmentRespondRequest request
    ) {
        return ApiResponse.<OrderAmendmentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderAgreementService.accept(orderId, amendmentId, request))
                .build();
    }

    //phu luc doi gia: client tra them / hoan chenh lech qua vi roi moi ap dung
    @PostMapping("/{orderId}/amendments/{amendmentId}/settle")
    ApiResponse<OrderAmendmentResponse> settle(
            @PathVariable UUID orderId,
            @PathVariable UUID amendmentId
    ) {
        return ApiResponse.<OrderAmendmentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderAgreementService.settle(orderId, amendmentId))
                .build();
    }

    @PostMapping("/{orderId}/amendments/{amendmentId}/reject")
    ApiResponse<OrderAmendmentResponse> reject(
            @PathVariable UUID orderId,
            @PathVariable UUID amendmentId,
            @RequestBody(required = false) AmendmentRespondRequest request
    ) {
        return ApiResponse.<OrderAmendmentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderAgreementService.reject(orderId, amendmentId, request))
                .build();
    }
}
