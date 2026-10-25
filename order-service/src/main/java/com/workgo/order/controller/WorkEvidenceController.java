package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.WorkEvidenceCreationRequest;
import com.workgo.order.dto.response.WorkEvidenceResponse;
import com.workgo.order.enumeration.EvidencePhase;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.WorkEvidenceService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders")
public class WorkEvidenceController {

    WorkEvidenceService workEvidenceService;

    @PostMapping("/{orderId}/evidence")
    ApiResponse<WorkEvidenceResponse> createEvidence(
            @PathVariable UUID orderId,
            @RequestBody WorkEvidenceCreationRequest request) {

        return ApiResponse.<WorkEvidenceResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(workEvidenceService.createEvidence(orderId, request))
                .build();
    }

    //client hoac provider xem bang chung
    @GetMapping("/{orderId}/evidence")
    ApiResponse<PageResponse<WorkEvidenceResponse>> getEvidence(
            @PathVariable UUID orderId,
            @RequestParam(value = "phase", required = false) EvidencePhase phase,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
            ) {

        return ApiResponse.<PageResponse<WorkEvidenceResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(workEvidenceService.getEvidences(orderId, phase, page, size))
                .build();
    }

}
