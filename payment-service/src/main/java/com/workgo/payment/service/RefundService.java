package com.workgo.payment.service;

import com.workgo.payment.dto.gateway.GatewayRefundResult;
import com.workgo.payment.dto.request.EscrowRefundRequest;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.RefundReason;
import com.workgo.payment.enumeration.RefundStatus;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.EscrowMapper;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.RefundRepository;
import com.workgo.payment.service.gateway.PaymentGatewayClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class RefundService {

    static int FULL_REFUND_PERCENT = 100;

    RefundRepository refundRepository;
    EscrowAccountRepository escrowAccountRepository;
    EscrowService escrowService;
    EscrowMapper escrowMapper;
    Map<PaymentGateway, PaymentGatewayClient> gatewayClients;

    //order huy don da thanh toan -> hoan 100% cho client
    @Transactional
    public EscrowAccountResponse refundOrder(EscrowRefundRequest request) {

        if (request.getOrderId() == null) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ID_REQUIRED);
        }

        if (request.getRefundPercent() != null && request.getRefundPercent() != FULL_REFUND_PERCENT) {
            throw new AppException(ErrorCode.REFUND_PERCENT_NOT_SUPPORTED);
        }

        EscrowAccount escrow = escrowAccountRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));

        //order goi lai -> tra ket qua cu
        if (escrow.getStatus() == EscrowStatus.REFUNDED) {
            return escrowMapper.toResponse(escrow);
        }

        RefundReason reason = request.getReasonCode() == null
                ? RefundReason.ORDER_CANCELLED : request.getReasonCode();

        refund(escrow.getPayment(), escrow, reason, TriggeredBy.ORDER);

        return escrowMapper.toResponse(escrow);
    }

    //hoan toan bo payment, escrow = null khi payment trung chua duoc hold
    @Transactional(propagation = Propagation.MANDATORY)
    public Refund refund(Payment payment, EscrowAccount escrow, RefundReason reason, TriggeredBy initiatedBy) {

        //moi payment chi refund 1 lan
        Optional<Refund> existing = refundRepository.findByPayment_PaymentId(payment.getPaymentId());

        if (existing.isPresent()) {
            return existing.get();
        }

        //check truoc khi goi gateway, tranh tra tien roi moi bao loi
        if (escrow != null && !escrow.getStatus().canTransitionTo(EscrowStatus.REFUNDED)) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        Refund refund = refundRepository.save(Refund.builder()
                .amount(payment.getAmount())
                .reasonCode(reason)
                .initiatedBy(initiatedBy)
                .orderId(payment.getOrderId())
                .payment(payment)
                .escrowAccount(escrow)
                .build());

        GatewayRefundResult result = loadGatewayClient(payment.getGateway()).refund(payment, refund);

        Instant now = Instant.now();

        refund.setGatewayRef(result.getGatewayRef());
        refund.setUpdatedAt(now);

        if (!result.isSuccess()) {
            //giu nguyen escrow, admin xu ly
            log.error("Refund payment {} failed: {}", payment.getPaymentCode(), result.getFailureMessage());
            refund.setStatus(RefundStatus.FAILED);
            refund.setFailureMessage(result.getFailureMessage());
            return refundRepository.save(refund);
        }

        refund.setStatus(RefundStatus.COMPLETED);
        refund.setProcessedAt(now);
        log.info("Refund payment {} of order {} completed, reason {}", payment.getPaymentCode(), payment.getOrderId(), reason);

        if (escrow != null) {
            escrowService.refund(escrow, refund);
        }

        return refundRepository.save(refund);
    }

    //=====================================

    private PaymentGatewayClient loadGatewayClient(PaymentGateway gateway) {

        PaymentGatewayClient gatewayClient = gatewayClients.get(gateway);

        if (gatewayClient == null) {
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_NOT_SUPPORTED);
        }

        return gatewayClient;
    }

}
