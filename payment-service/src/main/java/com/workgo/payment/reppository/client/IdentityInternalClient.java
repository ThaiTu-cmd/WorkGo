package com.workgo.payment.reppository.client;

import com.workgo.payment.configuration.FeignInternalConfig;
import com.workgo.payment.dto.request.FinancialRestrictionSyncRequest;
import com.workgo.payment.dto.response.client.ProviderProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "identity-service", contextId = "paymentIdentityInternalClient",
        url = "${app.services.identity}", configuration = FeignInternalConfig.class)
public interface IdentityInternalClient {
    record PayoutEligibility(UUID userId,boolean allowed) {}
    @GetMapping("/internal/users/{id}/payout-eligibility")
    PayoutEligibility payoutEligibility(@PathVariable UUID id);

    record RestrictionAck(UUID providerId,UUID userId,String source,long sourceVersion,boolean blocked) {}
    @PutMapping("/internal/providers/by-user/{userId}/financial-restriction/receipt")
    RestrictionAck updateWithReceipt(@PathVariable UUID userId,@RequestBody FinancialRestrictionSyncRequest request);

    @GetMapping("/internal/providers/{providerId}")
    ProviderProfileResponse getProviderProfile(@PathVariable UUID providerId);

    @PutMapping("/internal/providers/by-user/{userId}/financial-restriction")
    ProviderProfileResponse updateFinancialRestriction(@PathVariable UUID userId,
                                                       @RequestBody FinancialRestrictionSyncRequest request);

}
