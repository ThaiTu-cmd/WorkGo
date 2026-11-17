package com.workgo.trust.repository.client;

import com.workgo.trust.dto.request.client.ServiceRatingStatsRequest;
import com.workgo.trust.dto.response.client.ServiceResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="trustCatalogClient", url="${app.services.catalog}", configuration=TrustClientsConfiguration.class)
public interface CatalogClient {
    @PutMapping("/internal/services/{serviceId}/rating-stats")
    ServiceResponse updateRatingStats(@PathVariable("serviceId") UUID serviceId, @RequestBody ServiceRatingStatsRequest request);
}
