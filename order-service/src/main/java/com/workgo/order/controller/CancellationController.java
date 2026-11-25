package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.CancellationCreationRequest;
import com.workgo.order.dto.request.CancellationRespondRequest;
import com.workgo.order.dto.response.CancellationRequestResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.CancellationService;
import com.workgo.order.service.LatenessAssessmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders")
public class CancellationController {

    CancellationService cancellationService;
    LatenessAssessmentService latenessAssessmentService;

    @PostMapping("/{orderId}/cancel")
    ApiResponse<CancellationRequestResponse> cancel(
            @PathVariable UUID orderId,
            @RequestBody CancellationCreationRequest request) {

        return ApiResponse.<CancellationRequestResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(cancellationService.cancel(orderId, request))
                .build();
    }

    @PostMapping("/{orderId}/cancel/respond")
    ApiResponse<CancellationRequestResponse> respond(
            @PathVariable UUID orderId,
            @RequestBody CancellationRespondRequest request) {

        return ApiResponse.<CancellationRequestResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(cancellationService.respond(orderId, request))
                .build();
    }

    @GetMapping("/{orderId}/cancellation")
    ApiResponse<CancellationRequestResponse> getCancellation(
            @PathVariable UUID orderId) {

        return ApiResponse.<CancellationRequestResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(cancellationService.getCancellation(orderId))
                .build();
    }

    @GetMapping("/{orderId}/lateness")
    ApiResponse<LatenessAssessmentService.LatenessAssessment> assessLate(
            @PathVariable UUID orderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant asOf) {

        return ApiResponse.<LatenessAssessmentService.LatenessAssessment>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(latenessAssessmentService.assessLate(orderId, asOf))
                .build();
    }

    @PostMapping("/{orderId}/lateness/progress")
    ApiResponse<LatenessAssessmentService.LatenessAssessment> submitProgressResponse(
            @PathVariable UUID orderId,
            @RequestBody LatenessAssessmentService.ProgressResponseCommand request) {

        return ApiResponse.<LatenessAssessmentService.LatenessAssessment>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(latenessAssessmentService.submitProgressResponse(orderId, request))
                .build();
    }

    @PostMapping("/{orderId}/lateness/explanation")
    ApiResponse<LatenessAssessmentService.LatenessAssessment> submitExplanation(
            @PathVariable UUID orderId,
            @RequestBody LatenessAssessmentService.ExplanationCommand request) {

        return ApiResponse.<LatenessAssessmentService.LatenessAssessment>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(latenessAssessmentService.submitExplanation(orderId, request))
                .build();
    }

}
