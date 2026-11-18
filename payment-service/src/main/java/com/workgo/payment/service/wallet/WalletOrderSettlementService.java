package com.workgo.payment.service.wallet;

import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.EscrowTransaction;
import com.workgo.payment.entity.FeeAssessment;
import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.EscrowTxnType;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.enumeration.WalletPostingType;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.EscrowTransactionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.workgo.payment.service.wallet.WalletAccountRef.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class WalletOrderSettlementService {

    WalletService walletService;
    EscrowAccountRepository escrowAccountRepository;
    EscrowTransactionRepository escrowTransactionRepository;

    //tru vi client, giu vao tai khoan rieng cua order; escrow chi giu trang thai + khoa tranh chap
    @Transactional
    public EscrowAccount hold(UUID orderId, UUID clientId, UUID providerId, UUID providerUserId,
                              UUID feePolicyVersionId, long total, long fee) {

        WalletPostingResult posting = walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("ORDER_HOLD:" + orderId)
                .postingType(WalletPostingType.ORDER_HOLD)
                .obligationId(orderId)
                .description("Hold order " + orderId)
                .legs(List.of(new WalletPostingLeg(userAvailable(clientId), -total),
                        new WalletPostingLeg(orderHeld(orderId), total)))
                .build());

        Instant now = Instant.now();

        EscrowAccount escrow = escrowAccountRepository.saveAndFlush(EscrowAccount.builder()
                .fundingSource(EscrowFundingSource.WALLET)
                .heldAmount(BigDecimal.valueOf(total))
                .platformFeeAmount(BigDecimal.valueOf(fee))
                .providerNetAmount(BigDecimal.valueOf(total - fee))
                .heldAt(now)
                .orderId(orderId)
                .clientId(clientId)
                .providerId(providerId)
                .providerUserId(providerUserId)
                .feePolicyVersionId(feePolicyVersionId)
                .holdTransactionId(posting.walletTransactionId())
                .orderSyncStatus(OrderSyncStatus.PENDING)
                .build());

        escrow.getTransactions().add(escrowTransactionRepository.save(EscrowTransaction.builder()
                .txnType(EscrowTxnType.HOLD)
                .amount(escrow.getHeldAmount())
                .balanceAfter(escrow.getHeldAmount())
                .triggeredBy(TriggeredBy.SYSTEM)
                .reasonCode("WALLET_PAYMENT")
                .escrowAccount(escrow)
                .build()));

        log.info("Wallet hold {} for order {}, client {}", total, orderId, clientId);

        return escrow;
    }

    //tien giu -> provider + phi WorkGo
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID release(EscrowAccount escrow) {

        long held = toLong(escrow.getHeldAmount());
        long fee = toLong(escrow.getPlatformFeeAmount());

        List<WalletPostingLeg> legs = new ArrayList<>();
        legs.add(new WalletPostingLeg(orderHeld(escrow.getOrderId()), -held));
        legs.add(new WalletPostingLeg(userAvailable(escrow.getProviderUserId()), held - fee));
        if (fee > 0) legs.add(new WalletPostingLeg(platformRevenue(), fee));

        return walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("ORDER_RELEASE:" + escrow.getOrderId())
                .postingType(WalletPostingType.ORDER_RELEASE)
                .obligationId(escrow.getOrderId())
                .description("Release order " + escrow.getOrderId())
                .legs(legs)
                .build()).walletTransactionId();
    }

    //hoan tien giu ve vi client, khong goi refund cong; client co loi thi phi huy tru thang vao tien hoan
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID refund(EscrowAccount escrow, long clientFee) {

        long held = toLong(escrow.getHeldAmount());

        List<WalletPostingLeg> legs = new ArrayList<>();
        legs.add(new WalletPostingLeg(orderHeld(escrow.getOrderId()), -held));
        legs.add(new WalletPostingLeg(userAvailable(escrow.getClientId()), held - clientFee));
        if (clientFee > 0) legs.add(new WalletPostingLeg(platformRevenue(), clientFee));

        return walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("ORDER_REFUND:" + escrow.getOrderId())
                .postingType(WalletPostingType.ORDER_REFUND)
                .obligationId(escrow.getOrderId())
                .description("Refund order " + escrow.getOrderId())
                .legs(legs)
                .build()).walletTransactionId();
    }

    //phi huy provider: chi tru trong so du kha dung dang co, khong lam am vi; phan con lai la khoan chua thu
    @Transactional(propagation = Propagation.MANDATORY)
    public CollectResult collectCancellationFee(EscrowAccount escrow, long fee) {

        WalletAccountRef provider = userAvailable(escrow.getProviderUserId());
        long collectable = Math.min(fee, Math.max(0, walletService.lockedBalanceOf(provider)));

        if (collectable == 0) return new CollectResult(0, null);

        UUID transactionId = walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("CANCELLATION_FEE:" + escrow.getOrderId())
                .postingType(WalletPostingType.CANCELLATION_FEE)
                .obligationId(escrow.getOrderId())
                .description("Cancellation fee of order " + escrow.getOrderId())
                .legs(List.of(new WalletPostingLeg(provider, -collectable),
                        new WalletPostingLeg(platformRevenue(), collectable)))
                .build()).walletTransactionId();

        return new CollectResult(collectable, transactionId);
    }

    //phi thanh cong cash: ghi du phi, thieu thi vi am (chi loai but toan nay duoc am); collected la phan vi thuc co
    @Transactional(propagation = Propagation.MANDATORY)
    public CollectResult chargeCashSuccessFee(UUID orderId, UUID providerUserId, long fee) {

        WalletAccountRef provider = userAvailable(providerUserId);
        long collectable = Math.min(fee, Math.max(0, walletService.lockedBalanceOf(provider)));

        UUID transactionId = walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("CASH_FEE:" + orderId)
                .postingType(WalletPostingType.CASH_SUCCESS_FEE)
                .obligationId(orderId)
                .description("Cash success fee of order " + orderId)
                .legs(List.of(new WalletPostingLeg(provider, -fee),
                        new WalletPostingLeg(platformRevenue(), fee)))
                .build()).walletTransactionId();

        return new CollectResult(collectable, transactionId);
    }

    //thu tiep phi huy con thieu khi vi co tien; key theo so da thu truoc do nen moi buoc chi ghi 1 lan
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID collectReceivable(FeeAssessment fee, UUID userId, long amount) {

        return walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("FEE_RECEIVABLE:" + fee.getFeeAssessmentId() + ":" + fee.getCollectedAmount())
                .postingType(WalletPostingType.CANCELLATION_FEE)
                .obligationId(fee.getOrderId())
                .description("Collect unpaid fee of order " + fee.getOrderId())
                .legs(List.of(new WalletPostingLeg(userAvailable(userId), -amount),
                        new WalletPostingLeg(platformRevenue(), amount)))
                .build()).walletTransactionId();
    }

    public record CollectResult(long collected, UUID transactionId) {
    }

    //tang gia: tru them vi client; giam gia: tra phan chenh ve vi client
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID adjust(EscrowAccount escrow, UUID amendmentId, long delta) {

        boolean increase = delta > 0;
        WalletAccountRef client = userAvailable(escrow.getClientId());
        WalletAccountRef held = orderHeld(escrow.getOrderId());

        return walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("ORDER_ADJUST:" + amendmentId)
                .postingType(increase ? WalletPostingType.ORDER_HOLD : WalletPostingType.ORDER_REFUND)
                .obligationId(escrow.getOrderId())
                .description("Amendment " + amendmentId + " of order " + escrow.getOrderId())
                .legs(increase
                        ? List.of(new WalletPostingLeg(client, -delta), new WalletPostingLeg(held, delta))
                        : List.of(new WalletPostingLeg(held, delta), new WalletPostingLeg(client, -delta)))
                .build()).walletTransactionId();
    }

    //=====================================

    private long toLong(BigDecimal amount) {

        try {
            return amount == null ? 0 : amount.longValueExact();
        } catch (ArithmeticException e) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_NOT_WHOLE_VND);
        }
    }
}
