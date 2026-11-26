package com.workgo.trust.repository.client;

import com.workgo.trust.dto.request.client.ProviderRatingStatsRequest;
import com.workgo.trust.dto.response.client.InternalProviderProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="trustIdentityClient", url="${app.services.identity}", configuration=TrustClientsConfiguration.class)
public interface IdentityClient {
    record RecoveryGrant(UUID id,UUID providerId,UUID actorId,String reason,java.time.Instant approvedAt,java.time.Instant expiresAt,long reputationVersion){}
    @GetMapping("/internal/recovery-grants/{id}") RecoveryGrant recoveryGrant(@PathVariable UUID id);
    record Admission(UUID providerId,boolean mayReceiveNewOrders,boolean payoutAllowed,long sourceVersion,UUID recoveryGrantId){}
    @GetMapping("/internal/providers/{id}/admission") Admission admission(@PathVariable UUID id);
    @GetMapping("/internal/providers/{providerId}")
    InternalProviderProfileResponse getProviderProfile(@PathVariable("providerId") UUID providerId);
    @PutMapping("/internal/providers/{providerId}/rating-stats")
    InternalProviderProfileResponse updateRatingStats(@PathVariable("providerId") UUID providerId, @RequestBody ProviderRatingStatsRequest request);
}
