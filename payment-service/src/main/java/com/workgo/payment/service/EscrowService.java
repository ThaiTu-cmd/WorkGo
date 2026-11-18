package com.workgo.payment.service;

import com.workgo.payment.dto.request.EscrowAdjustRequest;
import com.workgo.payment.dto.request.EscrowFreezeRequest;
import com.workgo.payment.dto.request.EscrowReleaseRequest;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.EscrowCommandReceipt;
import com.workgo.payment.reppository.EscrowCommandReceiptRepository;
import com.workgo.payment.entity.EscrowTransaction;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.EscrowTxnType;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.EscrowMapper;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.EscrowTransactionRepository;
import com.workgo.payment.service.wallet.WalletOrderSettlementService;
import com.workgo.payment.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class EscrowService {

    EscrowAccountRepository escrowAccountRepository;
    EscrowTransactionRepository escrowTransactionRepository;
    EscrowCommandReceiptRepository commandReceipts;
    EscrowLockService escrowLocks;
    TrustDisputeGuard disputeGuard;
    EscrowMapper escrowMapper;
    WalletOrderSettlementService walletOrderSettlementService;
    FeeAssessmentService feeAssessmentService;
    FeeReceivableService feeReceivableService;
    TokenUtils tokenUtils;

    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<EscrowAccount> hold(Payment payment) {

        if (escrowAccountRepository.existsByOrderId(payment.getOrderId())) {
            return Optional.empty();
        }

        EscrowAccount escrow = escrowAccountRepository.save(EscrowAccount.builder()
                .heldAmount(payment.getAmount())
                .platformFeeAmount(payment.getPlatformFeeAmount())
                .providerNetAmount(payment.getProviderNetAmount())
                .currency(payment.getCurrency())
                .heldAt(Instant.now())
                .orderId(payment.getOrderId())
                .clientId(payment.getPayerId())
                .providerId(payment.getProviderId())
                .payment(payment)
                .build());

        escrowTransactionRepository.save(EscrowTransaction.builder()
                .txnType(EscrowTxnType.HOLD)
                .amount(payment.getAmount())
                .balanceAfter(payment.getAmount())
                .triggeredBy(TriggeredBy.GATEWAY)
                .escrowAccount(escrow)
                .build());

        log.info("Escrow hold {} for order {}, payment {}", payment.getAmount(), payment.getOrderId(), payment.getPaymentCode());

        return Optional.of(escrow);
    }

    @Transactional
    public EscrowAccountResponse release(EscrowReleaseRequest request) {

        if (request.getOrderId() == null) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ID_REQUIRED);
        }

        EscrowAccount escrow = escrowLocks.lock(request.getOrderId());

        //order goi lai -> tra ket qua cu, khong ghi txn moi
        if (escrow.getStatus() == EscrowStatus.RELEASED) {
            return escrowMapper.toResponse(escrow);
        }

        disputeGuard.assertMayTransfer(escrow, request.getDisputeId());

        if (!escrow.getStatus().canTransitionTo(EscrowStatus.RELEASED)) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        releaseLocked(escrow, TriggeredBy.ORDER, "ORDER_COMPLETED");

        return escrowMapper.toResponse(escrow);
    }

    //goi khi da khoa escrow va qua guard tranh chap / trang thai
    @Transactional(propagation = Propagation.MANDATORY)
    public void releaseLocked(EscrowAccount escrow, TriggeredBy triggeredBy, String reasonCode) {

        if (escrow.getFundingSource() == EscrowFundingSource.WALLET) {
            escrow.setSettleTransactionId(walletOrderSettlementService.release(escrow));
            feeAssessmentService.recordSuccessFee(escrow, escrow.getSettleTransactionId());
            feeReceivableService.settleAfterCredit(escrow.getProviderUserId());
        }

        BigDecimal fee = escrow.getPlatformFeeAmount() == null
                ? BigDecimal.ZERO : escrow.getPlatformFeeAmount();
        BigDecimal balance = escrow.getHeldAmount().subtract(fee);

        if (fee.signum() > 0) {
            addTransaction(escrow, EscrowTxnType.FEE, fee, balance, triggeredBy, reasonCode);
        }

        addTransaction(escrow, EscrowTxnType.RELEASE, balance, BigDecimal.ZERO, triggeredBy, reasonCode);

        Instant now = Instant.now();

        escrow.setReleasedAmount(escrow.getHeldAmount());
        escrow.setReleasedAt(now);
        escrow.setStatus(EscrowStatus.RELEASED);
        escrow.setUpdatedAt(now);

        log.info("Escrow released for order {}, fee {}, provider net {}", escrow.getOrderId(), fee, balance);

        escrowAccountRepository.save(escrow);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void refund(EscrowAccount escrow, Refund refund) {
        markRefunded(escrow, refund.getAmount(), refund.getInitiatedBy(), refund.getReasonCode().name());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void markRefunded(EscrowAccount escrow, BigDecimal amount, TriggeredBy triggeredBy, String reasonCode) {

        if (!escrow.getStatus().canTransitionTo(EscrowStatus.REFUNDED)) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        addTransaction(escrow, EscrowTxnType.REFUND, amount, BigDecimal.ZERO, triggeredBy, reasonCode);

        Instant now = Instant.now();

        escrow.setRefundedAmount(amount);
        escrow.setRefundedAt(now);
        escrow.setStatus(EscrowStatus.REFUNDED);
        escrow.setUpdatedAt(now);

        escrowAccountRepository.save(escrow);

        log.info("Escrow refunded {} for order {}, reason {}", amount, escrow.getOrderId(), reasonCode);
    }

    @Transactional
    public EscrowAccountResponse adjust(EscrowAdjustRequest request) {

        if (request.getOrderId() == null) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ID_REQUIRED);
        }

        long total = toWholeVnd(request.getNewTotalAmount());
        long fee = request.getNewPlatformFee() == null ? 0
                : request.getNewPlatformFee().setScale(0, RoundingMode.HALF_UP).longValueExact();

        if (request.getAmendmentId() == null || fee < 0 || fee > total) {
            throw new AppException(ErrorCode.ESCROW_ADJUST_INVALID);
        }

        EscrowAccount escrow = escrowLocks.lock(request.getOrderId());

        //order goi lai cung phu luc -> tra ket qua cu, khac so tien la xung dot
        Optional<EscrowTransaction> applied = escrowTransactionRepository
                .findFirstByEscrowAccount_EscrowAccountIdAndTxnTypeAndSagaId(
                        escrow.getEscrowAccountId(), EscrowTxnType.ADJUST, request.getAmendmentId());
        if (applied.isPresent()) {
            if (applied.get().getBalanceAfter().compareTo(BigDecimal.valueOf(total)) != 0) {
                throw new AppException(ErrorCode.ESCROW_COMMAND_CONFLICT);
            }
            return escrowMapper.toResponse(escrow);
        }

        if (escrow.getFundingSource() != EscrowFundingSource.WALLET) {
            throw new AppException(ErrorCode.ESCROW_ADJUST_NOT_SUPPORTED);
        }

        disputeGuard.assertMayTransfer(escrow, null);

        if (escrow.getStatus() != EscrowStatus.HOLDING) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        long delta = total - escrow.getHeldAmount().longValueExact();

        if (delta != 0) {
            walletOrderSettlementService.adjust(escrow, request.getAmendmentId(), delta);
        }

        escrow.setHeldAmount(BigDecimal.valueOf(total));
        escrow.setPlatformFeeAmount(BigDecimal.valueOf(fee));
        escrow.setProviderNetAmount(BigDecimal.valueOf(total - fee));
        escrow.setUpdatedAt(Instant.now());

        addTransaction(escrow, EscrowTxnType.ADJUST, BigDecimal.valueOf(Math.abs(delta)), escrow.getHeldAmount(),
                TriggeredBy.ORDER, delta >= 0 ? "AMENDMENT_INCREASE" : "AMENDMENT_DECREASE", request.getAmendmentId());

        log.info("Escrow of order {} adjusted by {} for amendment {}", escrow.getOrderId(), delta, request.getAmendmentId());

        return escrowMapper.toResponse(escrowAccountRepository.save(escrow));
    }

    @Transactional
    public EscrowAccountResponse freeze(EscrowFreezeRequest request) {
        return applyDisputeCommand(request, EscrowTxnType.FREEZE);
    }

    @Transactional
    public EscrowAccountResponse unfreeze(EscrowFreezeRequest request) {
        return applyDisputeCommand(request, EscrowTxnType.UNFREEZE);
    }

    private EscrowAccountResponse applyDisputeCommand(EscrowFreezeRequest request, EscrowTxnType operation) {
        EscrowAccount escrow = loadEscrowForDispute(request);
        String reason = loadReasonCode(request, operation == EscrowTxnType.FREEZE
                ? "DISPUTE_OPENED" : "DISPUTE_WITHDRAWN");
        Optional<EscrowCommandReceipt> previous = commandReceipts.findByOrderIdAndDisputeIdAndOperation(
                request.getOrderId(), request.getDisputeId(), operation);
        if (previous.isPresent()) {
            if (!previous.get().getReasonCode().equals(reason)) {
                throw new AppException(ErrorCode.ESCROW_COMMAND_CONFLICT);
            }
            // A replay acknowledges the committed command and returns CURRENT state.
            return escrowMapper.toResponse(escrow);
        }
        if (operation == EscrowTxnType.FREEZE) {
            boolean withdrawn = commandReceipts.findByOrderIdAndDisputeIdAndOperation(
                    request.getOrderId(), request.getDisputeId(), EscrowTxnType.UNFREEZE).isPresent();
            if (!withdrawn) {
                if (escrow.getStatus() != EscrowStatus.HOLDING) {
                    throw new AppException(escrow.getStatus() == EscrowStatus.FROZEN
                            ? ErrorCode.ESCROW_DISPUTE_CONFLICT : ErrorCode.ESCROW_INVALID_STATUS);
                }
                escrow.setActiveDisputeId(request.getDisputeId());
                escrow.setStatus(EscrowStatus.FROZEN);
                addTransaction(escrow, operation, escrow.getHeldAmount(), escrow.getHeldAmount(),
                        TriggeredBy.SYSTEM, reason, request.getDisputeId());
            }
        } else {
            if (escrow.getStatus() == EscrowStatus.FROZEN) {
                if (request.getDisputeId().equals(escrow.getActiveDisputeId())) {
                    escrow.setStatus(EscrowStatus.HOLDING);
                    escrow.setActiveDisputeId(null);
                    addTransaction(escrow, operation, escrow.getHeldAmount(), escrow.getHeldAmount(),
                            TriggeredBy.SYSTEM, reason, request.getDisputeId());
                }
                // A withdrawal for another lifecycle persists its tombstone but never unlocks this owner.
                // Response remains FROZEN: ACK is not a claim that the current escrow was unfrozen.
            } else if (escrow.getStatus() != EscrowStatus.HOLDING) {
                throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
            }
            // HOLDING still persists a tombstone: withdrawal may arrive before freeze.
        }
        commandReceipts.save(EscrowCommandReceipt.builder().orderId(request.getOrderId())
                .disputeId(request.getDisputeId()).operation(operation).reasonCode(reason).build());
        escrow.setUpdatedAt(Instant.now());
        return escrowMapper.toResponse(escrowAccountRepository.save(escrow));
    }

    @Transactional(readOnly = true)
    public EscrowAccountResponse getEscrowOfOrder(UUID orderId) {

        EscrowAccount escrow = escrowAccountRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));

        assertParticipant(escrow);

        return escrowMapper.toResponse(escrow);
    }

    //=====================================

    private long toWholeVnd(BigDecimal amount) {

        if (amount == null || amount.signum() <= 0) {
            throw new AppException(ErrorCode.ESCROW_ADJUST_INVALID);
        }

        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            throw new AppException(ErrorCode.ESCROW_ADJUST_INVALID);
        }
    }

    private void addTransaction(EscrowAccount escrow, EscrowTxnType type, BigDecimal amount,
                                BigDecimal balanceAfter, TriggeredBy triggeredBy, String reasonCode) {

        addTransaction(escrow, type, amount, balanceAfter, triggeredBy, reasonCode, null);
    }

    //sagaId luu disputeId de truy vet freeze/unfreeze
    private void addTransaction(EscrowAccount escrow, EscrowTxnType type, BigDecimal amount,
                                BigDecimal balanceAfter, TriggeredBy triggeredBy, String reasonCode, UUID sagaId) {

        escrow.getTransactions().add(escrowTransactionRepository.save(EscrowTransaction.builder()
                .txnType(type)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .triggeredBy(triggeredBy)
                .reasonCode(reasonCode)
                .sagaId(sagaId)
                .escrowAccount(escrow)
                .build()));
    }

    private EscrowAccount loadEscrowForDispute(EscrowFreezeRequest request) {

        if (request.getOrderId() == null) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ID_REQUIRED);
        }

        if (request.getDisputeId() == null) {
            throw new AppException(ErrorCode.ESCROW_DISPUTE_ID_REQUIRED);
        }

        return escrowLocks.lock(request.getOrderId());
    }

    private String loadReasonCode(EscrowFreezeRequest request, String defaultReason) {
        return request.getReasonCode() == null || request.getReasonCode().isBlank()
                ? defaultReason : request.getReasonCode();
    }

    //nguoi ngoai -> bao not found de khong lo escrow cua nguoi khac
    private void assertParticipant(EscrowAccount escrow) {

        if (tokenUtils.getCurrentUserId().equals(escrow.getClientId())) {
            return;
        }

        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();

        if (providerId != null && providerId.equals(escrow.getProviderId())) {
            return;
        }

        throw new AppException(ErrorCode.ESCROW_NOT_FOUND);
    }

}
