package com.workgo.payment.service;

import com.workgo.payment.dto.request.FinancialRestrictionSyncRequest;
import com.workgo.payment.dto.response.client.ProviderProfileResponse;
import com.workgo.payment.entity.FinancialRestriction;
import com.workgo.payment.reppository.FinancialRestrictionRepository;
import com.workgo.payment.reppository.client.CatalogInternalClient;
import com.workgo.payment.reppository.client.IdentityInternalClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

//payment la nguon goc; identity/catalog chi giu ban sao de hien thi, guard tien van hoi payment truc tiep
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FinancialRestrictionService {

    FinancialRestrictionRepository financialRestrictionRepository;
    IdentityInternalClient identityInternalClient;
    CatalogInternalClient catalogInternalClient;

    //ghi cung transaction voi but toan; chi tang version khi trang thai doi
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(UUID userId, boolean restricted) {

        FinancialRestriction state = financialRestrictionRepository.findById(userId).orElse(null);

        if (state == null) {
            if (!restricted) return;
            state = FinancialRestriction.builder()
                    .userId(userId)
                    .build();
        } else if (state.isRestricted() == restricted) {
            return;
        }

        state.setRestricted(restricted);
        state.setVersion(state.getVersion() + 1);
        state.setUpdatedAt(Instant.now());
        financialRestrictionRepository.save(state);

        log.info("User {} financial restriction -> {} (v{})", userId, restricted, state.getVersion());
    }

    public void sync(UUID userId) {

        FinancialRestriction state = financialRestrictionRepository.findById(userId).orElse(null);
        if (state == null) return;

        FinancialRestrictionSyncRequest request = FinancialRestrictionSyncRequest.builder()
                .restricted(state.isRestricted())
                .version(state.getVersion())
                .build();

        UUID providerId = state.getProviderId();

        if (state.getIdentitySyncedVersion() < state.getVersion()) {
            ProviderProfileResponse provider = identityInternalClient.updateFinancialRestriction(userId, request);
            providerId = provider.getProviderProfileId();
            financialRestrictionRepository.markIdentitySynced(userId, state.getVersion(), providerId, Instant.now());
        }

        if (state.getCatalogSyncedVersion() < state.getVersion()) {
            catalogInternalClient.updateFinancialRestriction(providerId, request);
            financialRestrictionRepository.markCatalogSynced(userId, state.getVersion(), Instant.now());
        }
    }
}
