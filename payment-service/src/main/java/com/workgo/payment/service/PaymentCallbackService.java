package com.workgo.payment.service;

import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.response.PaymentResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.enumeration.RefundReason;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.PaymentMapper;
import com.workgo.payment.reppository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentCallbackService {

    PaymentRepository paymentRepository;
    PaymentStatusService paymentStatusService;
    EscrowService escrowService;
    OrderSyncService orderSyncService;
    RefundService refundService;
    PaymentMapper paymentMapper;

    //ket qua thanh toan tu gateway IPN
    @Transactional
    public PaymentResponse handle(GatewayCallbackResult result) {

        Payment payment = paymentRepository.findByPaymentCode(result.getPaymentCode())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (result.getAmount() == null || result.getAmount().compareTo(payment.getAmount()) != 0) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        if (payment.getStatus() == PaymentStatus.SUCCEEDED
                || payment.getStatus() == PaymentStatus.FAILED) {
            return paymentMapper.toResponse(payment);
        }

        payment.setGatewayTxnId(result.getGatewayTxnId());
        payment.setRawResponse(result.getRawResponse());

        if (!result.isSuccess()) {
            if (payment.getStatus().canTransitionTo(PaymentStatus.FAILED)) {
                payment.setFailureCode(result.getFailureCode());
                payment.setFailureMessage(result.getFailureMessage());
                paymentStatusService.transition(payment, PaymentStatus.FAILED);
            }
            return paymentMapper.toResponse(paymentRepository.save(payment));
        }

        //EXPIRED / CANCELLED van nhan, vi tien da bi tru that
        paymentStatusService.transition(payment, PaymentStatus.SUCCEEDED);

        //order da co escrow (tra tre vao QR cu) -> khong hold, hoan lai payment nay
        if (escrowService.hold(payment).isEmpty()) {
            log.warn("Order {} already has escrow, refund duplicate payment {}", payment.getOrderId(), payment.getPaymentCode());
            payment.setOrderSyncStatus(OrderSyncStatus.NOT_REQUIRED);
            payment = paymentRepository.save(payment);
            refundService.refund(payment, null, RefundReason.DUPLICATE_PAYMENT, TriggeredBy.SYSTEM);
            return paymentMapper.toResponse(payment);
        }

        payment.setOrderSyncStatus(OrderSyncStatus.PENDING);
        payment = paymentRepository.save(payment);

        syncOrderAfterCommit(payment.getPaymentId());

        return paymentMapper.toResponse(payment);
    }

    //=====================================

    //commit xong moi bao order, loi thi OrderSyncJob goi lai
    private void syncOrderAfterCommit(UUID paymentId) {

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    orderSyncService.sync(paymentId);
                } catch (Exception e) {
                    log.warn("Sync order failed for payment {}, job will retry", paymentId, e);
                }
            }
        });
    }

}
