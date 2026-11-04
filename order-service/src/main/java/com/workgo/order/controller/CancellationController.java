package com.workgo.order.controller;


import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.CancellationCreationRequest;
import com.workgo.order.dto.request.CancellationRespondRequest;
import com.workgo.order.dto.response.CancellationRequestResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.CancellationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders")
public class CancellationController {

    CancellationService cancellationService;

    //client hoac provider yeu cau huy don
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

    //ben con lai dong y hoac tu choi huy don
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

}
