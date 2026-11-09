package com.workgo.payment.reppository.client;

import com.workgo.payment.configuration.FeignInternalConfig;
import com.workgo.payment.dto.request.PaymentConfirmedRequest;
import com.workgo.payment.dto.response.client.OrderPaymentInfoResponse;
import com.workgo.payment.dto.response.client.PaymentConfirmationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "order-service", url = "${app.services.order}", configuration = FeignInternalConfig.class)
public interface OrderClient {

    @GetMapping("/internal/orders/{orderId}/payment-info")
    OrderPaymentInfoResponse getPaymentInfo(@PathVariable UUID orderId);

    @PostMapping("/internal/orders/{orderId}/payment-confirmed")
    PaymentConfirmationResponse confirmPayment(@PathVariable UUID orderId,
                                               @RequestBody PaymentConfirmedRequest request);

}
