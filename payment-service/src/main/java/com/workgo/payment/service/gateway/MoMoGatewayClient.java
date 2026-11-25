package com.workgo.payment.service.gateway;

import com.workgo.payment.configuration.MoMoProperties;
import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.gateway.GatewayCharge;
import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.dto.gateway.MoMoCreateRequest;
import com.workgo.payment.dto.gateway.MoMoCreateResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.client.MoMoClient;
import com.workgo.payment.utils.HmacUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class MoMoGatewayClient implements PaymentGatewayClient {

    //gioi han cua momo sandbox
    static long MIN_AMOUNT = 1_000;
    static long MAX_AMOUNT = 50_000_000;

    static String REQUEST_TYPE = "captureWallet";

    MoMoProperties properties;
    MoMoClient moMoClient;

    @Override
    public PaymentGateway supports() {
        return PaymentGateway.MOMO;
    }

    @Override
    public GatewayCreateResult createPayment(GatewayCharge charge, String clientIp) {

        assertConfigured();

        long amount = charge.getAmount().setScale(0, RoundingMode.DOWN).longValueExact();

        if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_OUT_OF_RANGE);
        }

        String code = charge.getCode();
        String orderInfo = charge.getDescription();

        String rawSignature = "accessKey=" + properties.getAccessKey()
                + "&amount=" + amount
                + "&extraData="
                + "&ipnUrl=" + properties.getIpnUrl()
                + "&orderId=" + code
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + properties.getPartnerCode()
                + "&redirectUrl=" + properties.getRedirectUrl()
                + "&requestId=" + code
                + "&requestType=" + REQUEST_TYPE;

        MoMoCreateResponse response = moMoClient.create(MoMoCreateRequest.builder()
                .partnerCode(properties.getPartnerCode())
                .requestId(code)
                .amount(amount)
                .orderId(code)
                .orderInfo(orderInfo)
                .redirectUrl(properties.getRedirectUrl())
                .ipnUrl(properties.getIpnUrl())
                .requestType(REQUEST_TYPE)
                .extraData("")
                .lang("vi")
                .signature(sign(rawSignature))
                .build());

        if (response.getResultCode() == null || response.getResultCode() != 0) {
            throw new IllegalStateException("MoMo create failed: " + response.getResultCode() + " " + response.getMessage());
        }

        return GatewayCreateResult.builder()
                .paymentUrl(response.getPayUrl())
                .qrCodeUrl(response.getQrCodeUrl())
                .deeplink(response.getDeeplink())
                .build();
    }

    @Override
    public GatewayCallbackResult verifyCallback(Map<String, String> params) {

        assertConfigured();

        String rawSignature = "accessKey=" + properties.getAccessKey()
                + "&amount=" + value(params, "amount")
                + "&extraData=" + value(params, "extraData")
                + "&message=" + value(params, "message")
                + "&orderId=" + value(params, "orderId")
                + "&orderInfo=" + value(params, "orderInfo")
                + "&orderType=" + value(params, "orderType")
                + "&partnerCode=" + value(params, "partnerCode")
                + "&payType=" + value(params, "payType")
                + "&requestId=" + value(params, "requestId")
                + "&responseTime=" + value(params, "responseTime")
                + "&resultCode=" + value(params, "resultCode")
                + "&transId=" + value(params, "transId");

        String signature = params.get("signature");

        if (signature == null || !MessageDigest.isEqual(
                signature.toLowerCase().getBytes(StandardCharsets.UTF_8),
                sign(rawSignature).getBytes(StandardCharsets.UTF_8))) {
            throw new AppException(ErrorCode.GATEWAY_INVALID_SIGNATURE);
        }

        String resultCode = value(params, "resultCode");
        boolean success = "0".equals(resultCode);

        if (!properties.getPartnerCode().equals(params.get("partnerCode")) || !java.util.Objects.equals(params.get("orderId"), params.get("requestId")) || (params.containsKey("currency") && !"VND".equals(params.get("currency")))) {
            throw new AppException(ErrorCode.TOP_UP_SOURCE_MISMATCH);
        }

        return GatewayCallbackResult.builder()
                .verified(true).currency("VND").merchant(properties.getPartnerCode())
                .paymentCode(params.get("orderId"))
                .success(success)
                .amount(new BigDecimal(value(params, "amount")))
                .gatewayTxnId(params.get("transId"))
                .failureCode(success ? null : "MOMO_" + resultCode)
                .failureMessage(success ? null : params.get("message"))
                .rawResponse(new TreeMap<>(params).toString())
                .build();
    }

    //PLANNED: goi {endpoint}/refund voi transId, tam thoi de FAILED cho admin hoan tay
    @Override
    public GatewayRefundResult refund(Payment payment, Refund refund) {
        return GatewayRefundResult.builder()
                .success(false)
                .failureMessage("MoMo refund is not supported yet, admin must refund manually")
                .build();
    }

    //=====================================

    private String value(Map<String, String> params, String key) {
        String value = params.get(key);
        return value == null ? "" : value;
    }

    private String sign(String rawSignature) {
        return HmacUtils.hmacSha256(properties.getSecretKey(), rawSignature);
    }

    private void assertConfigured() {
        if (isBlank(properties.getPartnerCode()) || isBlank(properties.getAccessKey())
                || isBlank(properties.getSecretKey())) {
            throw new IllegalStateException("MoMo is not configured (MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY)");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

}
