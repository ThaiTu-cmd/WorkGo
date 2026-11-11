package com.workgo.payment.service.gateway;

import com.workgo.payment.configuration.VnPayProperties;
import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.utils.HmacUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

//VNPay API v2.1.0: tao link thanh toan + verify IPN / return
@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class VnPayGatewayClient implements PaymentGatewayClient {

    //gio Viet Nam (sample java cua vnpay dung Etc/GMT+7 la sai, do la UTC-7)
    static DateTimeFormatter VNPAY_DATE = DateTimeFormatter
            .ofPattern("yyyyMMddHHmmss")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    static String SUCCESS_CODE = "00";

    VnPayProperties properties;

    @Override
    public PaymentGateway supports() {
        return PaymentGateway.VNPAY;
    }

    @Override
    public GatewayCreateResult createPayment(Payment payment, String clientIp) {

        assertConfigured();

        if (!"VND".equals(payment.getCurrency())) {
            throw new IllegalStateException("VNPay only supports VND");
        }

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", properties.getTmnCode());
        params.put("vnp_Amount", payment.getAmount().movePointRight(2).setScale(0, RoundingMode.DOWN).toPlainString());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", payment.getPaymentCode());
        params.put("vnp_OrderInfo", "Thanh toan " + payment.getPaymentCode());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        params.put("vnp_IpAddr", clientIp == null ? "127.0.0.1" : clientIp);
        params.put("vnp_CreateDate", VNPAY_DATE.format(payment.getCreatedAt()));
        //D12: QR het han cung luc voi payment
        params.put("vnp_ExpireDate", VNPAY_DATE.format(payment.getExpiresAt()));
        params.put("vnp_BankCode", resolveBankCode(payment));

        String query = buildQuery(params);

        return GatewayCreateResult.builder()
                .paymentUrl(properties.getPayUrl() + "?" + query + "&vnp_SecureHash=" + sign(query))
                .build();
    }

    //IPN va return url cung 1 cach verify
    @Override
    public GatewayCallbackResult verifyCallback(Map<String, String> params) {

        assertConfigured();

        String secureHash = params.get("vnp_SecureHash");

        //chi ky tren cac field vnp_, bo 2 field chu ky
        Map<String, String> fields = params.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("vnp_"))
                .filter(entry -> !entry.getKey().equals("vnp_SecureHash")
                        && !entry.getKey().equals("vnp_SecureHashType"))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        if (secureHash == null || !MessageDigest.isEqual(
                secureHash.toLowerCase().getBytes(StandardCharsets.UTF_8),
                sign(buildQuery(fields)).getBytes(StandardCharsets.UTF_8))) {
            throw new AppException(ErrorCode.GATEWAY_INVALID_SIGNATURE);
        }

        String responseCode = params.get("vnp_ResponseCode");
        boolean success = SUCCESS_CODE.equals(responseCode)
                && SUCCESS_CODE.equals(params.get("vnp_TransactionStatus"));

        return GatewayCallbackResult.builder()
                .paymentCode(params.get("vnp_TxnRef"))
                .success(success)
                .amount(new BigDecimal(params.get("vnp_Amount")).movePointLeft(2))
                .gatewayTxnId(params.get("vnp_TransactionNo"))
                .failureCode(success ? null : "VNPAY_" + responseCode)
                .failureMessage(success ? null : "VNPay response code " + responseCode)
                .rawResponse(new TreeMap<>(params).toString())
                .build();
    }

    //PLANNED: goi api refund (vnp_Command=refund), tam thoi de FAILED cho admin hoan tay
    @Override
    public GatewayRefundResult refund(Payment payment, Refund refund) {
        return GatewayRefundResult.builder()
                .success(false)
                .failureMessage("VNPay refund is not supported yet, admin must refund manually")
                .build();
    }

    //=====================================

    //sort theo key, encode value US_ASCII (space -> +), bo field rong, noi bang &
    private String buildQuery(Map<String, String> params) {
        return new TreeMap<>(params).entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isEmpty())
                .map(entry -> entry.getKey() + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                .collect(Collectors.joining("&"));
    }

    private String sign(String data) {
        return HmacUtils.hmacSha512(properties.getHashSecret(), data);
    }

    //null -> client tu chon phuong thuc tren trang vnpay
    private String resolveBankCode(Payment payment) {

        if (payment.getPaymentMethod() == null) {
            return null;
        }

        return switch (payment.getPaymentMethod()) {
            case QR -> "VNPAYQR";
            case ATM_CARD -> "VNBANK";
            case INTL_CARD -> "INTCARD";
            default -> null;
        };
    }

    private void assertConfigured() {
        if (isBlank(properties.getTmnCode()) || isBlank(properties.getHashSecret())) {
            throw new IllegalStateException("VNPay is not configured (VNPAY_TMN_CODE, VNPAY_HASH_SECRET)");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

}
