package com.workgo.order.controller.internal;

import com.workgo.order.dto.response.PaymentConfirmationResponse;
import com.workgo.order.entity.OrderSnapshot;
import com.workgo.order.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/orders")
public class InternalOrderController {

    OrderService orderService;

    @PostMapping("/{orderId}/confirm")
    PaymentConfirmationResponse<Object> confirm(
            @PathVariable UUID orderId) {
        return orderService.confirmPayment(orderId);
    }

}
