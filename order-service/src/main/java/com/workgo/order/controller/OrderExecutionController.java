package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.response.ExecutionResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.ExecutionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders")
public class OrderExecutionController {

    ExecutionService executionService;

    @GetMapping("/{orderId}/execution")
    ApiResponse<ExecutionResponse> getExecution(@PathVariable UUID orderId) {
        return ApiResponse.<ExecutionResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(executionService.getExecution(orderId))
                .build();
    }

}
