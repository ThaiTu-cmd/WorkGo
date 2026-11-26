package com.workgo.payment.service;

import com.workgo.payment.dto.response.FeeAssessmentResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.FeeAssessment;
import com.workgo.payment.entity.FeePolicyVersion;
import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.FeeType;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.FeeAssessmentMapper;
import com.workgo.payment.reppository.FeeAssessmentRepository;
import com.workgo.payment.service.wallet.WalletOrderSettlementService;
import com.workgo.payment.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FeeAssessmentService {

    FeeAssessmentRepository feeAssessmentRepository;
    FeeAssessmentMapper feeAssessmentMapper;
    FeePolicyService feePolicyService;
    WalletOrderSettlementService walletOrderSettlementService;
    FeeReceivableService feeReceivableService;
    FeeReminderService feeReminderService;
    TokenUtils tokenUtils;

    //phi thanh cong da tru tu tien giu luc release
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordSuccessFee(EscrowAccount escrow, UUID releaseTransactionId) {

        assertNoFeeYet(escrow.getOrderId());

        long fee = escrow.getPlatformFeeAmount() == null ? 0 : escrow.getPlatformFeeAmount().longValueExact();

        feeAssessmentRepository.save(FeeAssessment.builder()
                .orderId(escrow.getOrderId())
                .feeType(FeeType.SUCCESS)
                .chargedParty(FeeChargedParty.PROVIDER)
                .chargedUserId(escrow.getProviderUserId())
                .feePolicyVersionId(feePolicyService.loadForOrder(escrow.getFeePolicyVersionId()).getFeePolicyVersionId())
                .baseAmount(escrow.getHeldAmount().longValueExact())
                .amount(fee)
                .collectedAmount(fee)
                .status(fee == 0 ? FeeAssessmentStatus.WAIVED : FeeAssessmentStatus.COLLECTED)
                .collectTransactionId(releaseTransactionId)
                .build());
    }

    //hoan tien order vi theo ket luan: tra ve so tien client thuc nhan
    @Transactional(propagation = Propagation.MANDATORY)
    public long refundWithCancellationFee(EscrowAccount escrow, FeeChargedParty chargedParty, UUID decisionId) {

        assertNoFeeYet(escrow.getOrderId());

        FeeChargedParty party = chargedParty == null ? FeeChargedParty.NONE : chargedParty;
        FeePolicyVersion policy = feePolicyService.loadForOrder(escrow.getFeePolicyVersionId());
        long held = escrow.getHeldAmount().longValueExact();
        long fee = party == FeeChargedParty.NONE ? 0 : feePolicyService.cancellationFee(policy, held);

        //client loi: tru thang vao tien hoan; provider loi: client nhan du, phi thu nguon rieng
        long clientFee = party == FeeChargedParty.CLIENT ? fee : 0;
        escrow.setSettleTransactionId(walletOrderSettlementService.refund(escrow, clientFee));

        FeeAssessment assessment = FeeAssessment.builder()
                .orderId(escrow.getOrderId())
                .feeType(FeeType.CANCELLATION)
                .chargedParty(party)
                .chargedUserId(switch (party) {
                    case CLIENT -> escrow.getClientId();
                    case PROVIDER -> escrow.getProviderUserId();
                    case NONE -> null;
                })
                .feePolicyVersionId(policy.getFeePolicyVersionId())
                .decisionId(decisionId)
                .baseAmount(held)
                .amount(fee)
                .build();

        if (party == FeeChargedParty.CLIENT) {
            assessment.setCollectedAmount(fee);
            assessment.setCollectTransactionId(escrow.getSettleTransactionId());
        } else if (party == FeeChargedParty.PROVIDER) {
            WalletOrderSettlementService.CollectResult collected = walletOrderSettlementService.collectCancellationFee(escrow, fee);
            assessment.setCollectedAmount(collected.collected());
            assessment.setCollectTransactionId(collected.transactionId());
        }

        assessment.setStatus(fee == 0 ? FeeAssessmentStatus.WAIVED
                : assessment.getCollectedAmount() == fee ? FeeAssessmentStatus.COLLECTED
                : FeeAssessmentStatus.OUTSTANDING);
        feeAssessmentRepository.save(assessment);

        if (assessment.getStatus() == FeeAssessmentStatus.OUTSTANDING) {
            feeReminderService.enqueue(assessment);
        }

        if (party == FeeChargedParty.PROVIDER) {
            feeReceivableService.refreshRestriction(escrow.getProviderUserId());
        }

        log.info("Order {} cancelled, fee {} charged to {}, collected {}",
                escrow.getOrderId(), fee, party, assessment.getCollectedAmount());

        return held - clientFee;
    }

    @Transactional
    public FeeAssessmentResponse recordCashSuccessFee(UUID orderId, UUID providerUserId, UUID feePolicyVersionId,
                                                      long orderAmount, long fee) {

        var policy = feePolicyService.loadForOrder(feePolicyVersionId);
        if (orderAmount <= 0 || orderAmount > 2000000 || fee != feePolicyService.successFee(policy,orderAmount))
            throw new AppException(ErrorCode.CASH_FEE_INVALID);

        FeeAssessment assessment = FeeAssessment.builder()
                .orderId(orderId)
                .feeType(FeeType.SUCCESS)
                .chargedParty(FeeChargedParty.PROVIDER)
                .chargedUserId(providerUserId)
                .feePolicyVersionId(feePolicyService.loadForOrder(feePolicyVersionId).getFeePolicyVersionId())
                .baseAmount(orderAmount)
                .amount(fee)
                .status(FeeAssessmentStatus.WAIVED)
                .build();

        if (fee > 0) {
            WalletOrderSettlementService.CollectResult charged =
                    walletOrderSettlementService.chargeCashSuccessFee(orderId, providerUserId, fee);
            assessment.setCollectedAmount(charged.collected());
            assessment.setCollectTransactionId(charged.transactionId());
            assessment.setStatus(charged.collected() == fee ? FeeAssessmentStatus.COLLECTED : FeeAssessmentStatus.OUTSTANDING);
        }

        log.info("Cash fee {} of order {} charged to provider {}, wallet covered {}",
                fee, orderId, providerUserId, assessment.getCollectedAmount());

        FeeAssessmentResponse response = feeAssessmentMapper.toResponse(feeAssessmentRepository.saveAndFlush(assessment));
        feeReceivableService.refreshRestriction(providerUserId);

        return response;
    }

    public FeeAssessmentResponse replayCashFee(FeeAssessment assessment, long fee) {

        if (assessment.getFeeType() != FeeType.SUCCESS || assessment.getAmount() != fee) {
            throw new AppException(ErrorCode.FEE_ALREADY_ASSESSED);
        }

        return feeAssessmentMapper.toResponse(assessment);
    }

    @Transactional(readOnly = true)
    public List<FeeAssessmentResponse> getMyFees() {

        return feeAssessmentRepository.findAllByChargedUserIdOrderByCreatedAtDesc(tokenUtils.getCurrentUserId()).stream()
                .map(feeAssessmentMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional(readOnly = true)
    public List<FeeAssessmentResponse> getByStatus(FeeAssessmentStatus status) {

        return feeAssessmentRepository.findAllByStatusOrderByCreatedAtAsc(status).stream()
                .map(feeAssessmentMapper::toResponse)
                .toList();
    }

    //=====================================

    //moi order chi 1 loai phi: khong thu chong phi thanh cong va phi huy
    private void assertNoFeeYet(UUID orderId) {

        if (feeAssessmentRepository.existsByOrderId(orderId)) {
            throw new AppException(ErrorCode.FEE_ALREADY_ASSESSED);
        }
    }
}
