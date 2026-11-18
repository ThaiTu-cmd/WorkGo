package com.workgo.payment.reppository.client;

import com.workgo.payment.configuration.FeignInternalConfig;
import com.workgo.payment.dto.request.FinancialRestrictionSyncRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "catalog-service", contextId = "paymentCatalogInternalClient",
        url = "${app.services.catalog}", configuration = FeignInternalConfig.class)
public interface CatalogInternalClient {

    @PutMapping("/internal/providers/{providerId}/financial-restriction")
    void updateFinancialRestriction(@PathVariable UUID providerId,
                                    @RequestBody FinancialRestrictionSyncRequest request);

}
