package com.workgo.payment.service;

import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.gateway.VnPayIpnResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.PaymentRepository;
import com.workgo.payment.service.gateway.PaymentGatewayClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.UUID;

//IPN + return url cua vnpay / momo, chi IPN moi cap nhat DB
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class GatewayCallbackService {

    Map<PaymentGateway, PaymentGatewayClient> gatewayClients;
    PaymentCallbackService paymentCallbackService;
    PaymentRepository paymentRepository;

    @NonFinal
    @Value("${app.frontend-result-url}")
    String frontendResultUrl;

    //00, 02 -> vnpay dung | 01, 04, 97, 99 -> vnpay goi lai (toi da 10 lan, 5 phut/lan)
    public VnPayIpnResponse handleVnPayIpn(Map<String, String> params) {

        try {
            //1. check chu ky truoc tien
            GatewayCallbackResult result = gatewayClients.get(PaymentGateway.VNPAY).verifyCallback(params);

            //2. tim payment theo vnp_TxnRef
            Payment payment = paymentRepository.findByPaymentCode(result.getPaymentCode()).orElse(null);

            if (payment == null) {
                return vnPayResponse("01", "Order not found");
            }

            //3. so tien
            if (result.getAmount().compareTo(payment.getAmount()) != 0) {
                return vnPayResponse("04", "Invalid amount");
            }

            //4. da xu ly roi
            if (isProcessed(payment)) {
                return vnPayResponse("02", "Order already confirmed");
            }

            //5. cap nhat payment, hold escrow, bao order
            paymentCallbackService.handle(result);

            return vnPayResponse("00", "Confirm Success");

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.GATEWAY_INVALID_SIGNATURE) {
                log.warn("VNPay IPN invalid signature, txnRef {}", params.get("vnp_TxnRef"));
                return vnPayResponse("97", "Invalid signature");
            }
            log.error("VNPay IPN failed, txnRef {}: {}", params.get("vnp_TxnRef"), e.getMessage());
            return vnPayResponse("99", "Unknow error");
        } catch (Exception e) {
            log.error("VNPay IPN failed, txnRef {}", params.get("vnp_TxnRef"), e);
            return vnPayResponse("99", "Unknow error");
        }
    }

    //momo chi can http status: 204 = da nhan, loi -> 4xx/5xx
    public HttpStatus handleMoMoIpn(Map<String, String> params) {

        try {
            GatewayCallbackResult result = gatewayClients.get(PaymentGateway.MOMO).verifyCallback(params);

            Payment payment = paymentRepository.findByPaymentCode(result.getPaymentCode()).orElse(null);

            if (payment == null) {
                log.warn("MoMo IPN payment {} not found", result.getPaymentCode());
                return HttpStatus.NOT_FOUND;
            }

            if (result.getAmount().compareTo(payment.getAmount()) != 0) {
                log.warn("MoMo IPN amount mismatch for payment {}", result.getPaymentCode());
                return HttpStatus.BAD_REQUEST;
            }

            //momo goi lai -> van tra 204
            if (!isProcessed(payment)) {
                paymentCallbackService.handle(result);
            }

            return HttpStatus.NO_CONTENT;

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.GATEWAY_INVALID_SIGNATURE) {
                log.warn("MoMo IPN invalid signature, orderId {}", params.get("orderId"));
                return HttpStatus.BAD_REQUEST;
            }
            log.error("MoMo IPN failed, orderId {}: {}", params.get("orderId"), e.getMessage());
            return HttpStatus.INTERNAL_SERVER_ERROR;
        } catch (Exception e) {
            log.error("MoMo IPN failed, orderId {}", params.get("orderId"), e);
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    //return url: chi verify chu ky + chuyen ve FE, khong cap nhat DB (FE poll GET /payments/{id})
    public String buildReturnRedirect(PaymentGateway gateway, Map<String, String> params) {

        String result;
        String paymentCode = null;

        try {
            GatewayCallbackResult callback = gatewayClients.get(gateway).verifyCallback(params);
            paymentCode = callback.getPaymentCode();
            result = callback.isSuccess() ? "success" : "failed";
        } catch (Exception e) {
            result = "invalid";
        }

        UUID paymentId = paymentCode == null ? null : paymentRepository.findByPaymentCode(paymentCode)
                .map(Payment::getPaymentId)
                .orElse(null);

        return UriComponentsBuilder.fromUriString(frontendResultUrl)
                .queryParam("paymentId", paymentId)
                .queryParam("result", result)
                .build()
                .toUriString();
    }

    //=====================================

    private boolean isProcessed(Payment payment) {
        return payment.getStatus() == PaymentStatus.SUCCEEDED
                || payment.getStatus() == PaymentStatus.FAILED;
    }

    private VnPayIpnResponse vnPayResponse(String rspCode, String message) {
        return VnPayIpnResponse.builder()
                .rspCode(rspCode)
                .message(message)
                .build();
    }

}
