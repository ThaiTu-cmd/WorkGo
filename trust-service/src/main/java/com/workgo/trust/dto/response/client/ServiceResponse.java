package com.workgo.trust.dto.response.client;
import java.time.Instant;
import java.util.UUID;

public record ServiceResponse(UUID serviceId, UUID providerId, UUID categoryId, String executionType,
        String title, String slug, String description, double basePrice, String currency, String status,
        double avgRating, long reviewCount, long orderCount, Instant publishedAt, Instant createdAt, Instant updatedAt) {}
