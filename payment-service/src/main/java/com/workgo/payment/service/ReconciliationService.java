package com.workgo.payment.service;

import com.workgo.payment.dto.request.ReconciliationActionRequest;
import com.workgo.payment.dto.response.ReconciliationCase;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.WalletPayout;
import com.workgo.payment.entity.WalletTopUp;
import com.workgo.payment.enumeration.AdminActionType;
import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.PayoutStatus;
import com.workgo.payment.enumeration.TopUpStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.WalletPayoutRepository;
import com.workgo.payment.reppository.WalletTopUpRepository;
import com.workgo.payment.service.admin.AdminAction;
import com.workgo.payment.service.admin.AdminAuditService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ReconciliationService {

    WalletTopUpRepository walletTopUpRepository;
    WalletPayoutRepository walletPayoutRepository;
    EscrowAccountRepository escrowAccountRepository;
    EscrowLockService escrowLocks;
    WalletOrderSyncService walletOrderSyncService;
    AdminAuditService adminAuditService;

    //moi case ghi ro buoc nao da commit (kem ma but toan) va buoc nao dang cho
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<ReconciliationCase> getCases() {

        List<ReconciliationCase> cases = new ArrayList<>();

        for (WalletTopUp topUp : walletTopUpRepository.findAllByStatusOrderByCreatedAtAsc(TopUpStatus.UNKNOWN)) {
            cases.add(ReconciliationCase.builder()
                    .caseType("TOP_UP_UNKNOWN")
                    .referenceId(topUp.getTopUpId())
                    .code(topUp.getTopUpCode())
                    .userId(topUp.getUserId())
                    .amount(topUp.getAmount())
                    .status(topUp.getStatus().name())
                    .committedSteps(List.of("TOP_UP_CREATED", "GATEWAY_LINK_ISSUED"))
                    .pendingStep("GATEWAY_RESULT")
                    .since(topUp.getExpiresAt())
                    .build());
        }

        for (PayoutStatus status : List.of(PayoutStatus.UNKNOWN, PayoutStatus.PROCESSING)) {
            for (WalletPayout payout : walletPayoutRepository.findAllByStatusOrderByCreatedAtAsc(status)) {
                cases.add(ReconciliationCase.builder()
                        .caseType("PAYOUT_" + status.name())
                        .referenceId(payout.getPayoutId())
                        .code(payout.getPayoutCode())
                        .userId(payout.getUserId())
                        .amount(payout.getAmount())
                        .status(status.name())
                        .committedSteps(List.of("PAYOUT_HOLD", "SENT_TO_BANK"))
                        .pendingStep("BANK_RESULT")
                        .ledgerTransactionId(payout.getHoldTransactionId())
                        .since(payout.getProcessingAt())
                        .build());
            }
        }

        for (EscrowAccount escrow : escrowAccountRepository.findAllByFundingSourceAndOrderSyncStatusAndStatusOrderByCreatedAtAsc(
                EscrowFundingSource.WALLET, OrderSyncStatus.FAILED, EscrowStatus.HOLDING)) {
            cases.add(ReconciliationCase.builder()
                    .caseType("ORDER_SYNC_FAILED")
                    .referenceId(escrow.getEscrowAccountId())
                    .userId(escrow.getClientId())
                    .orderId(escrow.getOrderId())
                    .amount(escrow.getHeldAmount().longValueExact())
                    .status(escrow.getStatus().name())
                    .committedSteps(List.of("WALLET_HOLD"))
                    .pendingStep("ORDER_CONFIRM")
                    .ledgerTransactionId(escrow.getHoldTransactionId())
                    .since(escrow.getHeldAt())
                    .build());
        }

        return cases;
    }

    //tien da giu xong, chi gui lai buoc bao order voi dung paymentId cu; khong cham vao tien
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ReconciliationCase retryOrderSync(UUID orderId, ReconciliationActionRequest request) {

        if (request == null || request.getReason() == null || request.getReason().isBlank()) {
            throw new AppException(ErrorCode.ORDER_SYNC_RETRY_NOT_ALLOWED);
        }

        EscrowAccount escrow = escrowLocks.lock(orderId);

        if (escrow.getFundingSource() != EscrowFundingSource.WALLET
                || escrow.getOrderSyncStatus() != OrderSyncStatus.FAILED
                || escrow.getStatus() != EscrowStatus.HOLDING) {
            throw new AppException(ErrorCode.ORDER_SYNC_RETRY_NOT_ALLOWED);
        }

        escrow.setOrderSyncStatus(OrderSyncStatus.PENDING);
        escrow.setOrderSyncRetryCount(0);
        escrowAccountRepository.save(escrow);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.ORDER_SYNC_RETRIED)
                .targetType("ESCROW")
                .targetId(escrow.getEscrowAccountId())
                .reason(request.getReason())
                .beforeState(Map.of("orderSyncStatus", OrderSyncStatus.FAILED))
                .afterState(Map.of("orderSyncStatus", OrderSyncStatus.PENDING))
                .build());

        syncAfterCommit(escrow.getEscrowAccountId());

        return ReconciliationCase.builder()
                .caseType("ORDER_SYNC_FAILED")
                .referenceId(escrow.getEscrowAccountId())
                .orderId(orderId)
                .status(OrderSyncStatus.PENDING.name())
                .committedSteps(List.of("WALLET_HOLD"))
                .pendingStep("ORDER_CONFIRM")
                .ledgerTransactionId(escrow.getHoldTransactionId())
                .build();
    }

    //=====================================

    //loi thi OrderSyncJob goi lai vi da ve PENDING
    private void syncAfterCommit(UUID escrowAccountId) {

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    walletOrderSyncService.syncOrder(escrowAccountId);
                } catch (Exception e) {
                    log.warn("Retry order sync failed for escrow {}, job will retry", escrowAccountId, e);
                }
            }
        });
    }
}
