package com.workgo.payment.service.gateway;

import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.PaymentGateway;

public interface PaymentGatewayClient {

    PaymentGateway supports();

    GatewayCreateResult createPayment(Payment payment, String clientIp);

    GatewayRefundResult refund(Payment payment, Refund refund);

}
