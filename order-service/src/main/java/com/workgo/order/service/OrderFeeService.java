package com.workgo.order.service;

import com.workgo.order.dto.response.client.FeePolicyResponse;
import com.workgo.order.dto.snapshot.PricingSnapshot;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.client.PaymentClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderFeeService {

    PaymentClient paymentClient;

    public FeePolicyResponse version(java.util.UUID id){
        try{var p=paymentClient.getFeePolicy(id);if(p==null||!id.equals(p.getFeePolicyVersionId())||p.getSuccessFeeRate()==null)throw new AppException(ErrorCode.PAYMENT_SERVICE_UNAVAILABLE);return p;}
        catch(FeignException e){throw new AppException(ErrorCode.PAYMENT_SERVICE_UNAVAILABLE);}
    }

    //phien ban phi dang hieu luc, order chot vao snapshot; policy moi khong hoi to order cu
    public FeePolicyResponse currentPolicy() {

        try {
            FeePolicyResponse policy = paymentClient.getCurrentFeePolicy();
            if (policy == null || policy.getFeePolicyVersionId() == null || policy.getSuccessFeeRate() == null) {
                throw new AppException(ErrorCode.PAYMENT_SERVICE_UNAVAILABLE);
            }
            return policy;
        } catch (FeignException e) {
            throw new AppException(ErrorCode.PAYMENT_SERVICE_UNAVAILABLE);
        }
    }

    //HALF_UP den 1d, phan provider la so con lai
    public BigDecimal successFee(BigDecimal amount, BigDecimal rate) {
        return amount.multiply(rate).setScale(0, RoundingMode.HALF_UP);
    }

    public PricingSnapshot.PricingSnapshotBuilder pricing(FeePolicyResponse policy) {

        return PricingSnapshot.builder()
                .platformFeeRate(policy.getSuccessFeeRate())
                .feePolicyVersionId(policy.getFeePolicyVersionId())
                .feePolicyVersionNo(policy.getVersionNo())
                .cancellationFeeRate(policy.getCancellationFeeRate())
                .cancellationFeeCap(policy.getCancellationFeeCap());
    }
}
