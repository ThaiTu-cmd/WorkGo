package com.workgo.payment.service;

import com.workgo.payment.dto.response.FinancialEligibilityResponse;
import com.workgo.payment.entity.FeeAssessment;
import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.enumeration.FeeType;
import com.workgo.payment.reppository.FeeAssessmentRepository;
import com.workgo.payment.service.wallet.WalletAccountRef;
import com.workgo.payment.service.wallet.WalletOrderSettlementService;
import com.workgo.payment.service.wallet.WalletService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FeeReceivableService {

    FeeAssessmentRepository feeAssessmentRepository;
    WalletService walletService;
    WalletOrderSettlementService walletOrderSettlementService;
    FinancialRestrictionService financialRestrictionService;

    //am vi hoac con phi huy chua thu -> chan viec moi; nap bu ve du thi tu go, khong dung toi che tai khac
    @Transactional(readOnly = true)
    public FinancialEligibilityResponse eligibilityOf(UUID userId) {

        long balance = walletService.balanceOf(WalletAccountRef.userAvailable(userId));
        long cancellationDebt = outstanding(userId, FeeType.CANCELLATION).stream()
                .mapToLong(this::remaining)
                .sum();

        return FinancialEligibilityResponse.builder()
                .userId(userId)
                .balance(balance)
                .outstandingFee(cancellationDebt + Math.max(0, -balance))
                .mayStartNewWork(balance >= 0 && cancellationDebt == 0)
                .build();
    }

    //goi trong transaction vua cong tien vao vi (nap, nhan tien order); khoa vi de 2 lan cong cung luc khong thu trung
    @Transactional(propagation = Propagation.MANDATORY)
    public void settleAfterCredit(UUID userId) {

        long balance = walletService.lockedBalanceOf(WalletAccountRef.userAvailable(userId));
        Instant now = Instant.now();

        //phi cash da ghi vao so (vi am): phan vi da bu lai chi cap nhat da thu, khong tru them
        List<FeeAssessment> cashFees = outstanding(userId, FeeType.SUCCESS);
        long repaid = cashFees.stream().mapToLong(this::remaining).sum() - Math.max(0, -balance);

        for (FeeAssessment fee : cashFees) {
            if (repaid <= 0) break;
            long part = Math.min(repaid, remaining(fee));
            markCollected(fee, part, now);
            repaid -= part;
        }

        //phi huy chua thu: tru tu so du duong vua co
        for (FeeAssessment fee : outstanding(userId, FeeType.CANCELLATION)) {
            if (balance <= 0) break;
            long part = Math.min(balance, remaining(fee));
            walletOrderSettlementService.collectReceivable(fee, userId, part);
            markCollected(fee, part, now);
            balance -= part;
        }

        refreshRestriction(userId);
    }

    //goi sau moi lan so du / no phi doi (ghi phi cash, phi huy chua thu, nap bu); khoa vi de cap nhat lan luot
    @Transactional(propagation = Propagation.MANDATORY)
    public void refreshRestriction(UUID userId) {

        walletService.lockedBalanceOf(WalletAccountRef.userAvailable(userId));
        financialRestrictionService.record(userId, !eligibilityOf(userId).isMayStartNewWork());
    }

    //=====================================

    private List<FeeAssessment> outstanding(UUID userId, FeeType feeType) {

        return feeAssessmentRepository.findAllByChargedUserIdAndFeeTypeAndStatusOrderByCreatedAtAsc(
                userId, feeType, FeeAssessmentStatus.OUTSTANDING);
    }

    private long remaining(FeeAssessment fee) {
        return fee.getAmount() - fee.getCollectedAmount();
    }

    private void markCollected(FeeAssessment fee, long part, Instant now) {

        fee.setCollectedAmount(fee.getCollectedAmount() + part);
        if (remaining(fee) == 0) fee.setStatus(FeeAssessmentStatus.COLLECTED);
        fee.setUpdatedAt(now);
        feeAssessmentRepository.save(fee);

        log.info("Fee of order {} collected {} more, {} left", fee.getOrderId(), part, remaining(fee));
    }
}
