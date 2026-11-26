package com.workgo.identity.controller.internal;

import com.workgo.identity.dto.request.FinancialRestrictionRequest;
import com.workgo.identity.dto.request.RatingStatsRequest;
import com.workgo.identity.dto.response.InternalProviderProfileResponse;
import com.workgo.identity.service.InternalProviderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/providers")
public class InternalProviderProfileController {
    private final InternalProviderProfileService providerProfileService;

    @PutMapping("/by-user/{userId}/financial-restriction/receipt")
    InternalProviderProfileService.RestrictionAck financialReceipt(@PathVariable UUID userId, @RequestBody FinancialRestrictionRequest request) {
        return providerProfileService.applyFinancialRestriction(userId,request);
    }

    @GetMapping("/{providerId}")
    InternalProviderProfileResponse getProviderProfile(@PathVariable UUID providerId) {
        return providerProfileService.getProviderProfile(providerId);
    }

    @PutMapping("/{providerId}/rating-stats")
    InternalProviderProfileResponse updateRatingStats(@PathVariable UUID providerId,
                                                      @RequestBody RatingStatsRequest request) {
        return providerProfileService.updateRatingStats(providerId, request);
    }

    @PutMapping("/by-user/{userId}/financial-restriction")
    InternalProviderProfileResponse updateFinancialRestriction(@PathVariable UUID userId,
                                                               @RequestBody FinancialRestrictionRequest request) {
        return providerProfileService.updateFinancialRestriction(userId, request);
    }
}
