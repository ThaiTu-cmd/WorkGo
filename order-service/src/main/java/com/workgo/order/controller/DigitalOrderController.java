package com.workgo.order.controller;


import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.DeliverySubmissionRequest;
import com.workgo.order.dto.request.RequirementSubmissionRequest;
import com.workgo.order.dto.request.RevisionRequestCreationRequest;
import com.workgo.order.dto.response.DeliveryPackageResponse;
import com.workgo.order.dto.response.RevisionRequestResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.DigitalFlowService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders/digital")
public class DigitalOrderController {

    DigitalFlowService digitalFlowService;

    //client nop yeu cau
    @PostMapping("/{orderId}/requirements")
    ApiResponse<Void> submitRequirements(
            @PathVariable UUID orderId,
            @RequestBody RequirementSubmissionRequest request) {

        digitalFlowService.submitRequirements(orderId, request);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }

    //provider nop tra ve cho client
    @PostMapping("/{orderId}/submissions")
    ApiResponse<DeliveryPackageResponse> submitDelivery(
            @PathVariable UUID orderId,
            @RequestBody DeliverySubmissionRequest request) {

        return ApiResponse.<DeliveryPackageResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(digitalFlowService.submitDelivery(orderId, request))
                .build();
    }

    @GetMapping("/{orderId}/submissions")
    ApiResponse<List<DeliveryPackageResponse>> getSubmissions(
            @PathVariable UUID orderId) {

        return ApiResponse.<List<DeliveryPackageResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(digitalFlowService.getDeliveryPackage(orderId))
                .build();
    }

    //client yeu cau sua
    @PostMapping("/{orderId}/revisions")
    ApiResponse<RevisionRequestResponse> requestRevision(
            @PathVariable UUID orderId,
            @RequestBody RevisionRequestCreationRequest request) {

        return ApiResponse.<RevisionRequestResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(digitalFlowService.requestRevision(orderId, request))
                .build();
    }

    @GetMapping("/{orderId}/revisions")
    ApiResponse<List<RevisionRequestResponse>> getRevisions(
            @PathVariable UUID orderId) {

        return ApiResponse.<List<RevisionRequestResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(digitalFlowService.getRevisions(orderId))
                .build();
    }

}
