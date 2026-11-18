package com.workgo.payment.service.gateway;

import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.gateway.GatewayCharge;
import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.utils.PaymentCodeGenerator;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Profile("dev")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MockGatewayClient implements PaymentGatewayClient {

    @Value("${payment.mock.base-url}")
    String baseUrl;

    @Override
    public PaymentGateway supports() {
        return PaymentGateway.MOCK;
    }

    @Override
    public GatewayCreateResult createPayment(GatewayCharge charge, String clientIp) {

        String path = charge.getCode().startsWith(PaymentCodeGenerator.TOP_UP_PREFIX) ? "/dev/payments/top-ups/" : "/dev/payments/";
        String paymentUrl = baseUrl + path + charge.getCode() + "/success";

        return GatewayCreateResult.builder()
                .paymentUrl(paymentUrl)
                .qrCodeUrl(paymentUrl)
                .build();
    }

    //mock khong co IPN, ket qua gia lap di qua DevPaymentController
    @Override
    public GatewayCallbackResult verifyCallback(Map<String, String> params) {
        throw new AppException(ErrorCode.PAYMENT_GATEWAY_NOT_SUPPORTED);
    }

    @Override
    public GatewayRefundResult refund(Payment payment, Refund refund) {
        return GatewayRefundResult.builder()
                .success(true)
                .gatewayRef("MOCK-REFUND-" + payment.getPaymentCode())
                .build();
    }

}
