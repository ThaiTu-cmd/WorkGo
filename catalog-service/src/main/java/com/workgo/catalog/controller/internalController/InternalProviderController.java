package com.workgo.catalog.controller.internalController;

import com.workgo.catalog.dto.request.FinancialRestrictionRequest;
import com.workgo.catalog.service.ProviderRestrictionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/providers")
public class InternalProviderController {

    ProviderRestrictionService providerRestrictionService;

    @PutMapping("/{providerId}/financial-restriction/receipt")
    ProviderRestrictionService.RestrictionAck financialReceipt(@PathVariable UUID providerId, @RequestBody FinancialRestrictionRequest request) {
        return providerRestrictionService.applyWithReceipt(providerId,request);
    }

    @PutMapping("/{providerId}/financial-restriction")
    void updateFinancialRestriction(
            @PathVariable UUID providerId,
            @RequestBody FinancialRestrictionRequest request
    ) {
        providerRestrictionService.applyFinancialRestriction(providerId, request);
    }

}
