package com.workgo.trust.dto.request.client;

/** aggregateVersion is allocated durably per provider when the snapshot is created. */
public record ProviderRatingStatsRequest(Double ratingAvg, Long ratingCount, Long aggregateVersion) {}
