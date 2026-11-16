package com.workgo.trust.dto.response.client;
import java.time.Instant;
import java.util.UUID;

public record InternalProviderProfileResponse(UUID providerProfileId, String providerType, String businessName,
        String bio, String verificationStatus, double ratingAvg, long ratingCount, int completedOrderCount,
        boolean acceptingOrders, Instant joinedAt, UUID userId, String userStatus) {}
