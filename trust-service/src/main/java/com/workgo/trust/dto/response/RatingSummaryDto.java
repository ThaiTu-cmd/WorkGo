package com.workgo.trust.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.*;

public record RatingSummaryDto(
        UUID targetId,
        double ratingAvg,
        long ratingCount,
        PageResponse<ReviewDto> reviews) {
}
