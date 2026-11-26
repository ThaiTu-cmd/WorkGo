package com.workgo.order.service;

import com.workgo.order.dto.response.client.FinancialEligibilityResponse;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.client.PaymentClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderFinancialEligibility {
    public UUID recoveryGrant(UUID provider){return admission.reservationGrant(provider);}

    PaymentClient paymentClient;
    ProviderAdmissionService admission;

    //chi chan viec moi; viec cu (giao, sua, nhan tien, dispute) van lam tiep. Payment loi -> chan luon, khong mo khe ho
    public void assertMayStartNewWork(UUID providerId) {

        FinancialEligibilityResponse eligibility;
        try {
            eligibility = paymentClient.getFinancialEligibility(providerId);
        } catch (FeignException e) {
            throw new AppException(ErrorCode.PAYMENT_SERVICE_UNAVAILABLE);
        }

        if (eligibility == null) {
            throw new AppException(ErrorCode.PAYMENT_SERVICE_UNAVAILABLE);
        }

        if (!eligibility.isMayStartNewWork()) {
            throw new AppException(ErrorCode.ORDER_PROVIDER_FINANCIALLY_RESTRICTED);
        }
        admission.reserve(providerId);
    }
}
