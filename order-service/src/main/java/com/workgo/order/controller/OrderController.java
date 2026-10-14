package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.enumeration.RoleName;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.apache.kafka.shaded.com.google.protobuf.Api;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders")
public class OrderController {

    OrderService orderService;

    //client tao mot order tu service co san cua provider
    @PostMapping
    ApiResponse<OrderResponse> createOrder(
            @RequestBody OrderCreationRequest request
            ){
        return ApiResponse.<OrderResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderService.createOrder(request))
                .build();
    }


    //lay toan bo order cua user hien tai tuy theo role
    @GetMapping
    ApiResponse<PageResponse<OrderResponse>> getMyOrders(
            @RequestParam(value = "roleName") RoleName roleName,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
            ){
        return ApiResponse.<PageResponse<OrderResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderService.getMyOrders(roleName, page, size))
                .build();
    }

    //lay cu the mot order
    @GetMapping("/{orderId}")
    ApiResponse<OrderResponse> getOrder(
            @PathVariable UUID orderId
            ){
        return ApiResponse.<OrderResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderService.getOrder(orderId))
                .build();
    }

    //lay toan bo lich su chinh sua cua mot order
    @GetMapping("/{orderId}/history")
    ApiResponse<PageResponse<OrderStatusHistoryResponse>> getOrderHistory(
            @PathVariable UUID orderId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
            ) {

        return ApiResponse.<PageResponse<OrderStatusHistoryResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderService.getOrderHistory(orderId, page, size))
                .build();
    }



}
