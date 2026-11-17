package com.workgo.order.controller.admin;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.response.OrderDetailResponse;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.admin.OrderMonitoringService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AdminOrderController {

    OrderMonitoringService orderMonitoringService;

    @GetMapping
    ApiResponse<PageResponse<OrderResponse>> searchOrders(
            @RequestParam(value = "status", required = false) OrderStatus status,
            @RequestParam(value = "executionType", required = false) ExecutionType executionType,
            @RequestParam(value = "clientId", required = false) UUID clientId,
            @RequestParam(value = "providerId", required = false) UUID providerId,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<OrderResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderMonitoringService.searchOrders(status, executionType, clientId, providerId,
                        from, to, page, size))
                .build();
    }

    @GetMapping("/{orderId}")
    ApiResponse<OrderDetailResponse> getOrder(@PathVariable UUID orderId) {

        return ApiResponse.<OrderDetailResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderMonitoringService.getOrder(orderId))
                .build();
    }

    @GetMapping("/{orderId}/history")
    ApiResponse<PageResponse<OrderStatusHistoryResponse>> getOrderHistory(
            @PathVariable UUID orderId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<OrderStatusHistoryResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderMonitoringService.getOrderHistory(orderId, page, size))
                .build();
    }
}
