package com.workgo.job.dto.response;

import java.util.UUID;

/** Display data only; never serialize the internal Identity profile into an application response. */
public record ProviderBasicDto(UUID providerId, String displayName, String avatarUrl,
                               double ratingAvg, long ratingCount) {
}
