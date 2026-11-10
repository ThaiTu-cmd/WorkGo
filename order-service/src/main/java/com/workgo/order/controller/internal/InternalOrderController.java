package com.workgo.order.controller.internal;

import com.workgo.order.dto.request.PaymentConfirmedRequest;
import com.workgo.order.dto.response.OrderPaymentInfoResponse;
import com.workgo.order.dto.response.PaymentConfirmationResponse;
import com.workgo.order.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/orders")
public class InternalOrderController {

    OrderService orderService;

    @GetMapping("/{orderId}/payment-info")
    OrderPaymentInfoResponse getPaymentInfo(
            @PathVariable UUID orderId) {
        return orderService.getPaymentInfo(orderId);
    }

    @PostMapping("/{orderId}/payment-confirmed")
    PaymentConfirmationResponse<Object> confirmPayment(
            @PathVariable UUID orderId,
            @RequestBody PaymentConfirmedRequest request) {
        return orderService.confirmPayment(orderId, request);
    }

}
