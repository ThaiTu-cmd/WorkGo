package com.workgo.trust.repository.client;

import com.workgo.trust.dto.request.client.ProviderRatingStatsRequest;
import com.workgo.trust.dto.response.client.InternalProviderProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="trustIdentityClient", url="${app.services.identity}", configuration=TrustClientsConfiguration.class)
public interface IdentityClient {
    @GetMapping("/internal/providers/{providerId}")
    InternalProviderProfileResponse getProviderProfile(@PathVariable("providerId") UUID providerId);
    @PutMapping("/internal/providers/{providerId}/rating-stats")
    InternalProviderProfileResponse updateRatingStats(@PathVariable("providerId") UUID providerId, @RequestBody ProviderRatingStatsRequest request);
}
