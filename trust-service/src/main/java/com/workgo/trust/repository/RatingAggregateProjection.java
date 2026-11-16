package com.workgo.trust.repository;

/** AVG is null for an empty scope; callers publish the reset snapshot as 0/0. */
public interface RatingAggregateProjection {
    Double getRatingAvg();
    Long getRatingCount();
}
