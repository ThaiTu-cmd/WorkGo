package com.workgo.trust.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.*;

public record ReviewDto(
        UUID reviewId,
        UUID orderId,
        UUID serviceId,
        UUID reviewerId,
        UUID revieweeId,
        ReviewDirection direction,
        Integer rating,
        String comment,
        boolean isPublished,
        ModerationStatus moderationStatus,
        Instant publishedAt,
        Instant createdAt) {
}
