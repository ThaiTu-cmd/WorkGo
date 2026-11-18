package com.workgo.payment.service;

import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class OrderSyncJob {

    PaymentRepository paymentRepository;
    OrderSyncService orderSyncService;
    EscrowAccountRepository escrowAccountRepository;
    WalletOrderSyncService walletOrderSyncService;

    @NonFinal
    @Value("${payment.sync.max-retry}")
    int maxRetry;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<Payment> payments = paymentRepository
                .findAllByStatusAndOrderSyncStatusAndOrderSyncRetryCountLessThan(
                        PaymentStatus.SUCCEEDED, OrderSyncStatus.PENDING, maxRetry);

        for (Payment payment : payments) {
            try {
                orderSyncService.sync(payment.getPaymentId());
            } catch (ObjectOptimisticLockingFailureException e) {
                //afterCommit cua IPN dang sync cung luc, bo qua
                log.info("Payment {} was updated by another request, skip sync", payment.getPaymentCode());
            } catch (Exception e) {
                log.warn("Sync order failed for payment {}", payment.getPaymentCode(), e);
            }
        }

        List<EscrowAccount> walletHolds = escrowAccountRepository
                .findAllByFundingSourceAndOrderSyncStatusAndOrderSyncRetryCountLessThan(
                        EscrowFundingSource.WALLET, OrderSyncStatus.PENDING, maxRetry);

        for (EscrowAccount escrow : walletHolds) {
            try {
                walletOrderSyncService.syncOrder(escrow.getEscrowAccountId());
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Wallet hold of order {} was updated by another request, skip sync", escrow.getOrderId());
            } catch (Exception e) {
                log.warn("Sync order failed for wallet hold of order {}", escrow.getOrderId(), e);
            }
        }
    }

}
