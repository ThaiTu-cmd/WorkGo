package com.workgo.trust.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.*;

public record OrderReviewStatusDto(
        UUID orderId,
        ReviewDirection myDirection,
        boolean myReviewSubmitted,
        boolean otherPartyReviewed,
        boolean isPublished,
        Instant reviewWindowExpiresAt,
        ReviewDto myReview,
        ReviewDto otherPartyReview) {
}
