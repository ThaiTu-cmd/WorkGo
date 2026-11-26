package com.workgo.payment.service;

import com.workgo.payment.dto.request.CashFeeRequest;
import com.workgo.payment.dto.response.FeeAssessmentResponse;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.FeeAssessmentMapper;
import com.workgo.payment.reppository.FeeAssessmentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CashFeeService {

    FeeAssessmentService feeAssessmentService;
    FeeAssessmentRepository feeAssessmentRepository;
    FeeAssessmentMapper feeAssessmentMapper;
    ProviderAccountService providerAccountService;

    //order cash da du nghiem thu + provider nhan tien -> ghi phi 1 lan, goi lai tra ket qua cu
    public FeeAssessmentResponse recordCashFee(CashFeeRequest request) {

        if (request == null || request.getOrderId() == null || request.getProviderId() == null
                || !Boolean.TRUE.equals(request.getWorkAccepted()) || !Boolean.TRUE.equals(request.getPaymentReceived())
                || request.getOutcomeId() == null || request.getActualReceivedAmount() == null
                || request.getOrderAmount() == null || request.getActualReceivedAmount().compareTo(request.getOrderAmount()) != 0) {
            throw new AppException(ErrorCode.CASH_FEE_INVALID);
        }

        long orderAmount = toWholeVnd(request.getOrderAmount());
        long fee = toWholeVnd(request.getFee());

        if (orderAmount <= 0 || orderAmount > 2000000 || fee > orderAmount) {
            throw new AppException(ErrorCode.CASH_FEE_INVALID);
        }

        UUID providerUserId = providerAccountService.userIdOf(request.getProviderId());
        var existed = feeAssessmentRepository.findByOrderId(request.getOrderId());
        if (existed.isPresent()) {
            var old = existed.get();
            if (!providerUserId.equals(old.getChargedUserId()) || old.getBaseAmount() != orderAmount
                    || !java.util.Objects.equals(old.getFeePolicyVersionId(),request.getFeePolicyVersionId()))
                throw new AppException(ErrorCode.CASH_FEE_INVALID);
            return feeAssessmentService.replayCashFee(existed.get(), fee);
        }

        try {
            return feeAssessmentService.recordCashSuccessFee(request.getOrderId(), providerUserId,
                    request.getFeePolicyVersionId(), orderAmount, fee);
        } catch (DataIntegrityViolationException e) {
            //2 lan goi cung luc: but toan cung key khong tru them, ben thua doc lai ket qua
            var winner=feeAssessmentRepository.findByOrderId(request.getOrderId()).orElseThrow(()->e);
            if(!providerUserId.equals(winner.getChargedUserId())||winner.getBaseAmount()!=orderAmount
                    ||!java.util.Objects.equals(winner.getFeePolicyVersionId(),request.getFeePolicyVersionId()))throw new AppException(ErrorCode.CASH_FEE_INVALID);
            return feeAssessmentService.replayCashFee(winner, fee);
        }
    }

    //=====================================

    private long toWholeVnd(BigDecimal amount) {

        if (amount == null || amount.signum() < 0) {
            throw new AppException(ErrorCode.CASH_FEE_INVALID);
        }

        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            throw new AppException(ErrorCode.CASH_FEE_INVALID);
        }
    }
}
