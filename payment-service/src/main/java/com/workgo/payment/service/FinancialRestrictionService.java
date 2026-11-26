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
    com.workgo.payment.reppository.client.JobInternalClient jobInternalClient;

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

        String error = null;
        if (state.getIdentitySyncedVersion() < state.getVersion()) try {
            var provider = identityInternalClient.updateWithReceipt(userId, request);
            if (provider == null || provider.providerId() == null || !userId.equals(provider.userId())
                    || !"FINANCIAL".equals(provider.source()) || provider.sourceVersion() != state.getVersion()
                    || provider.blocked() != state.isRestricted())
                throw new IllegalStateException("INVALID_IDENTITY_ACK");
            providerId = provider.providerId();
            financialRestrictionRepository.markIdentitySynced(userId, state.getVersion(), providerId, Instant.now());
        } catch (RuntimeException e) { error = "IDENTITY:" + e.getClass().getSimpleName(); }

        if (providerId == null) {
            financialRestrictionRepository.markError(userId,state.getVersion(),error == null ? "PROVIDER_MAPPING_PENDING" : error);
            return;
        }
        if (state.getCatalogSyncedVersion() < state.getVersion()) try {
            var ack = catalogInternalClient.updateWithReceipt(providerId, request);
            if (ack == null || !providerId.equals(ack.providerId()) || !"FINANCIAL".equals(ack.source())
                    || ack.sourceVersion() != state.getVersion() || ack.blocked() != state.isRestricted())
                throw new IllegalStateException("INVALID_CATALOG_ACK");
            financialRestrictionRepository.markCatalogSynced(userId, state.getVersion(), Instant.now());
        } catch (RuntimeException e) { error = "CATALOG:" + e.getClass().getSimpleName(); }
        if (state.getJobSyncedVersion() < state.getVersion()) try {
            var response = jobInternalClient.update(providerId, new com.workgo.payment.reppository.client.JobInternalClient.Change("FINANCIAL",state.getVersion(),state.isRestricted()));
            var ack = response == null ? null : response.getResult();
            if (ack == null || !providerId.equals(ack.providerId()) || !"FINANCIAL".equals(ack.source())
                    || ack.sourceVersion() != state.getVersion() || ack.blocked() != state.isRestricted())
                throw new IllegalStateException("INVALID_JOB_ACK");
            financialRestrictionRepository.markJobSynced(userId,state.getVersion(),Instant.now());
        } catch (RuntimeException e) { error = "JOB:" + e.getClass().getSimpleName(); }
        financialRestrictionRepository.markError(userId,state.getVersion(),error);
    }
}
