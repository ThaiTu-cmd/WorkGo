package com.workgo.trust.dto.request.client;

/** Service scope has its own sequence and aggregate, independent of provider scope. */
public record ServiceRatingStatsRequest(Double avgRating, Long reviewCount, Long aggregateVersion) {}
