package com.workgo.payment.service;

import com.workgo.payment.dto.request.PaymentConfirmedRequest;
import com.workgo.payment.dto.response.client.PaymentConfirmationResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.RefundReason;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.enumeration.client.OrderStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.client.OrderClient;
import com.workgo.payment.service.wallet.WalletOrderSettlementService;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class WalletOrderSyncService {

    EscrowAccountRepository escrowAccountRepository;
    WalletOrderSettlementService walletOrderSettlementService;
    EscrowService escrowService;
    EscrowLockService escrowLocks;
    OrderClient orderClient;

    @NonFinal
    @Value("${payment.sync.max-retry}")
    int maxRetry;

    //bao order da giu tien; order da huy (slot het han) -> hoan lai vi
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncOrder(UUID escrowAccountId) {

        EscrowAccount escrow = escrowAccountRepository.findById(escrowAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));

        if (escrow.getOrderSyncStatus() != OrderSyncStatus.PENDING) {
            return;
        }

        escrow = escrowLocks.lock(escrow.getOrderId());

        try {
            PaymentConfirmationResponse response = orderClient.confirmPayment(escrow.getOrderId(),
                    PaymentConfirmedRequest.builder()
                            .paymentId(escrow.getHoldTransactionId())
                            .build());

            if (response.getOrderStatus() == OrderStatus.CANCELLED) {
                log.warn("Order {} was cancelled, refund wallet hold", escrow.getOrderId());
                escrow.setSettleTransactionId(walletOrderSettlementService.refund(escrow, 0));
                escrowService.markRefunded(escrow, escrow.getHeldAmount(), TriggeredBy.SYSTEM,
                        RefundReason.ORDER_NOT_PAYABLE.name());
                escrow.setOrderSyncStatus(OrderSyncStatus.FAILED);
            } else {
                escrow.setOrderSyncStatus(OrderSyncStatus.SYNCED);
            }

        } catch (FeignException e) {

            int retryCount = escrow.getOrderSyncRetryCount() + 1;
            escrow.setOrderSyncRetryCount(retryCount);

            if (retryCount >= maxRetry) {
                log.error("Sync order {} failed {} times, wallet hold needs admin check", escrow.getOrderId(), retryCount, e);
                escrow.setOrderSyncStatus(OrderSyncStatus.FAILED);
            } else {
                log.warn("Sync order {} failed ({}), job will retry", escrow.getOrderId(), e.status());
            }
        }

        escrow.setUpdatedAt(Instant.now());
        escrowAccountRepository.save(escrow);
    }

}
