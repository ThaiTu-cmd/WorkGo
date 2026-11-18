package com.workgo.payment.service;

import com.workgo.payment.dto.request.SettlementCommand;
import com.workgo.payment.dto.response.SettlementResult;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.FeeAssessment;
import com.workgo.payment.entity.SettlementReceipt;
import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.SettlementDestination;
import com.workgo.payment.enumeration.SettlementOperation;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.SettlementReceiptMapper;
import com.workgo.payment.reppository.FeeAssessmentRepository;
import com.workgo.payment.reppository.SettlementReceiptRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class SettlementService {

    static String DECISION_REASON = "DISPUTE_DECISION";

    SettlementReceiptRepository settlementReceiptRepository;
    SettlementReceiptMapper settlementReceiptMapper;
    FeeAssessmentRepository feeAssessmentRepository;
    EscrowLockService escrowLocks;
    EscrowService escrowService;
    RefundService refundService;
    FeePolicyService feePolicyService;
    TrustDisputeGuard disputeGuard;

    @Transactional
    public SettlementResult settle(SettlementCommand command) {

        assertValid(command);
        FeeChargedParty branch = command.getBranch() == null ? FeeChargedParty.NONE : command.getBranch();
        String payloadHash = payloadHash(command, branch);

        //khoa truoc khi doc receipt: lenh goi lai dong thoi chi 1 ben chay
        EscrowAccount escrow = escrowLocks.lock(command.getOrderId());

        //xet receipt truoc guard trang thai: lan dau da doi escrow nen goi lai van phai tra ket qua cu
        Optional<SettlementReceipt> applied = settlementReceiptRepository.findByDecisionId(command.getDecisionId());
        if (applied.isPresent()) {
            if (!applied.get().getPayloadHash().equals(payloadHash)) {
                throw new AppException(ErrorCode.SETTLEMENT_CONFLICT);
            }
            return toResult(applied.get(), true);
        }

        //cung nghia vu khac decisionId khong duoc chi / hoan them
        if (settlementReceiptRepository.existsByOrderId(command.getOrderId())) {
            throw new AppException(ErrorCode.SETTLEMENT_ORDER_SETTLED);
        }

        if (escrow.getFundingSource() != EscrowFundingSource.WALLET) {
            throw new AppException(ErrorCode.SETTLEMENT_NOT_SUPPORTED);
        }

        assertMatchesEscrow(command, branch, escrow);
        disputeGuard.assertMayTransfer(escrow, command.getDisputeId());

        EscrowStatus target = command.getOperation() == SettlementOperation.RELEASE
                ? EscrowStatus.RELEASED : EscrowStatus.REFUNDED;
        if (!escrow.getStatus().canTransitionTo(target)) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        long held = escrow.getHeldAmount().longValueExact();
        long destinationAmount = command.getOperation() == SettlementOperation.RELEASE
                ? releaseOf(escrow)
                : refundService.refundWalletLocked(escrow, branch, command.getDecisionId(), TriggeredBy.ADMIN, DECISION_REASON);

        FeeAssessment fee = feeAssessmentRepository.findByOrderId(command.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.SETTLEMENT_INVALID));

        SettlementReceipt receipt = settlementReceiptRepository.saveAndFlush(SettlementReceipt.builder()
                .decisionId(command.getDecisionId())
                .orderId(command.getOrderId())
                .disputeId(command.getDisputeId())
                .payloadHash(payloadHash)
                .operation(command.getOperation())
                .branch(branch)
                .destination(command.getDestination())
                .destinationId(command.getDestinationId())
                .amount(held)
                .feeAmount(fee.getAmount())
                .destinationAmount(destinationAmount)
                .currency(escrow.getCurrency())
                .escrowStatus(escrow.getStatus())
                .settleTransactionId(escrow.getSettleTransactionId())
                .feeAssessmentId(fee.getFeeAssessmentId())
                .build());

        log.info("Decision {} settled order {}: {} {} to {}", command.getDecisionId(), command.getOrderId(),
                command.getOperation(), destinationAmount, command.getDestination());

        return toResult(receipt, false);
    }

    //=====================================

    private long releaseOf(EscrowAccount escrow) {

        escrowService.releaseLocked(escrow, TriggeredBy.ADMIN, DECISION_REASON);

        long fee = escrow.getPlatformFeeAmount() == null ? 0 : escrow.getPlatformFeeAmount().longValueExact();
        return escrow.getHeldAmount().longValueExact() - fee;
    }

    private void assertValid(SettlementCommand command) {

        BigDecimal amount = command.getAmount();

        if (command.getDecisionId() == null || command.getOrderId() == null
                || command.getOperation() == null || command.getDestination() == null
                || command.getDestinationId() == null || !"VND".equals(command.getCurrency())
                || amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 0) {
            throw new AppException(ErrorCode.SETTLEMENT_INVALID);
        }
    }

    //lenh phai khop dung escrow hien co: so tien, ben nhan, phien ban phi; release khong co phi huy
    private void assertMatchesEscrow(SettlementCommand command, FeeChargedParty branch, EscrowAccount escrow) {

        boolean release = command.getOperation() == SettlementOperation.RELEASE;
        UUID expectedDestinationId = release ? escrow.getProviderId() : escrow.getClientId();
        SettlementDestination expectedDestination = release ? SettlementDestination.PROVIDER : SettlementDestination.CLIENT;
        UUID policyId = feePolicyService.loadForOrder(escrow.getFeePolicyVersionId()).getFeePolicyVersionId();

        if (command.getAmount().compareTo(escrow.getHeldAmount()) != 0
                || !escrow.getCurrency().equals(command.getCurrency())
                || command.getDestination() != expectedDestination
                || !command.getDestinationId().equals(expectedDestinationId)
                || (release && branch != FeeChargedParty.NONE)
                || (command.getPolicyVersionId() != null && !command.getPolicyVersionId().equals(policyId))) {
            throw new AppException(ErrorCode.SETTLEMENT_MISMATCH);
        }
    }

    //hash tu payload da chuan hoa, khong tin hash do ben goi tu khai
    private String payloadHash(SettlementCommand command, FeeChargedParty branch) {

        String payload = String.join("|",
                command.getDecisionId().toString(),
                command.getOrderId().toString(),
                Objects.toString(command.getDisputeId(), "-"),
                command.getOperation().name(),
                branch.name(),
                command.getDestination().name(),
                command.getDestinationId().toString(),
                command.getAmount().stripTrailingZeros().toPlainString(),
                command.getCurrency(),
                Objects.toString(command.getPolicyVersionId(), "-"));

        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private SettlementResult toResult(SettlementReceipt receipt, boolean replayed) {

        SettlementResult result = settlementReceiptMapper.toResult(receipt);
        result.setReplayed(replayed);
        return result;
    }
}
