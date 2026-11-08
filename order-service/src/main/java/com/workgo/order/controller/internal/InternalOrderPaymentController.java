package com.workgo.order.controller.internal;

import com.workgo.order.dto.response.OrderPaymentInfoResponse;
import com.workgo.order.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

//payment-service goi, khong gan @Profile vi chay ca prod
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/orders")
public class InternalOrderPaymentController {

    OrderService orderService;

    @GetMapping("/{orderId}/payment-info")
    OrderPaymentInfoResponse getPaymentInfo(
            @PathVariable UUID orderId) {
        return orderService.getPaymentInfo(orderId);
    }

}
