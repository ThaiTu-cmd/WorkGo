package com.workgo.identity.dto.response;

import com.workgo.identity.enumeration.ProviderType;
import com.workgo.identity.enumeration.VerificationStatus;
import java.time.Instant;
import java.util.UUID;

public record InternalProviderProfileResponse(
        UUID providerProfileId, ProviderType providerType, String businessName, String bio,
        VerificationStatus verificationStatus, double ratingAvg, long ratingCount,
        int completedOrderCount, boolean acceptingOrders, Instant joinedAt, UUID userId,
        String userStatus) {
}
