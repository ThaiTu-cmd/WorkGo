package com.workgo.payment.service.gateway;

import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.gateway.GatewayCharge;
import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.PaymentGateway;

import java.util.Map;

public interface PaymentGatewayClient {

    PaymentGateway supports();

    GatewayCreateResult createPayment(GatewayCharge charge, String clientIp);

    GatewayCallbackResult verifyCallback(Map<String, String> params);

    GatewayRefundResult refund(Payment payment, Refund refund);

}
