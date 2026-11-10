package com.workgo.payment.service.gateway;

import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.PaymentGateway;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MockGatewayClient implements PaymentGatewayClient {

    @Value("${payment.mock.base-url}")
    String baseUrl;

    @Override
    public PaymentGateway supports() {
        return PaymentGateway.MOCK;
    }

    @Override
    public GatewayCreateResult createPayment(Payment payment, String clientIp) {

        String paymentUrl = baseUrl + "/dev/payments/" + payment.getPaymentCode() + "/success";

        return GatewayCreateResult.builder()
                .paymentUrl(paymentUrl)
                .qrCodeUrl(paymentUrl)
                .build();
    }

    //mock luon hoan tien thanh cong
    @Override
    public GatewayRefundResult refund(Payment payment, Refund refund) {
        return GatewayRefundResult.builder()
                .success(true)
                .gatewayRef("MOCK-REFUND-" + payment.getPaymentCode())
                .build();
    }

}
