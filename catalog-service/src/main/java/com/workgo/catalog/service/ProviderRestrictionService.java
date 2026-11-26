package com.workgo.catalog.service;

import com.workgo.catalog.dto.request.FinancialRestrictionRequest;
import com.workgo.catalog.entity.ProviderFinancialRestriction;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.repository.ProviderFinancialRestrictionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

//ban sao tu payment: an dich vu khoi tim kiem va chan publish, khong dung toi dich vu / slot da co
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderRestrictionService {

    ProviderFinancialRestrictionRepository providerFinancialRestrictionRepository;
    com.workgo.catalog.repository.ProviderRestrictionProjectionRepository restrictions;
    com.workgo.catalog.repository.httpclient.ContextIdentityClient identity;

    @Transactional
    public void applyFinancialRestriction(UUID providerId, FinancialRestrictionRequest request) {

        if (request == null || request.getRestricted() == null
                || request.getVersion() == null || request.getVersion() <= 0) {
            throw new AppException(ErrorCode.FINANCIAL_RESTRICTION_INVALID);
        }

        ProviderFinancialRestriction restriction = providerFinancialRestrictionRepository.findByIdForUpdate(providerId)
                .orElseGet(() -> ProviderFinancialRestriction.builder()
                        .providerId(providerId)
                        .build());

        //version cu / gui lap thi bo qua
        if (request.getVersion() == restriction.getVersion() && request.getRestricted() != restriction.isRestricted())
            throw new AppException(ErrorCode.FINANCIAL_RESTRICTION_INVALID);
        if (request.getVersion() <= restriction.getVersion()) {
            return;
        }

        restriction.setRestricted(request.getRestricted());
        restriction.setVersion(request.getVersion());
        restriction.setUpdatedAt(Instant.now());
        providerFinancialRestrictionRepository.save(restriction);
    }

    public void assertMayPublish(UUID providerId) {

        com.fasterxml.jackson.databind.JsonNode eligibility;
        try{eligibility=identity.admission(providerId);}catch(RuntimeException e){throw new AppException(ErrorCode.PROVIDER_ELIGIBILITY_UNAVAILABLE);}
        if(eligibility==null||!providerId.toString().equals(eligibility.path("providerId").asText()))throw new AppException(ErrorCode.PROVIDER_ELIGIBILITY_UNAVAILABLE);
        if(!eligibility.path("mayReceiveNewOrders").asBoolean())throw new AppException(ErrorCode.PROVIDER_RECEIVING_RESTRICTED);

        if (providerFinancialRestrictionRepository.existsByProviderIdAndRestrictedTrue(providerId) || restrictions.existsByProviderIdAndBlockedTrueAndSourceNot(providerId,"REPUTATION")) {
            throw new AppException(ErrorCode.PROVIDER_FINANCIALLY_RESTRICTED);
        }
    }

    public record RestrictionAck(UUID providerId,String source,long sourceVersion,boolean blocked) {}
    @Transactional
    public RestrictionAck applyWithReceipt(UUID providerId,FinancialRestrictionRequest request) {
        applyFinancialRestriction(providerId,request);
        var row = providerFinancialRestrictionRepository.findById(providerId).orElseThrow();
        return new RestrictionAck(providerId,"FINANCIAL",row.getVersion(),row.isRestricted());
    }
}
