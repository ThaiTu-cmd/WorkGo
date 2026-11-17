package com.workgo.trust.repository;

import com.workgo.trust.entity.Review;
import com.workgo.trust.enumeration.ReviewDirection;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    Optional<Review> findByOrderIdAndDirection(UUID orderId, ReviewDirection direction);

    // Locks existing rows only. The first pair of inserts needs an order-scoped
    // lock in the publication service; an empty SELECT cannot serialize writers.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Review r where r.orderId = :orderId order by r.reviewId")
    List<Review> findAllByOrderIdForUpdate(@Param("orderId") UUID orderId);

    List<Review> findAllByOrderId(UUID orderId);

    String PUBLIC = "r.isPublished = true and r.moderationStatus = com.workgo.trust.enumeration.ModerationStatus.APPROVED";
    String CLIENT_DIRECTION = "r.direction = com.workgo.trust.enumeration.ReviewDirection.CLIENT_TO_PROVIDER";

    @Query("select r from Review r where r.revieweeId = :revieweeId and r.direction = :direction and " + PUBLIC)
    Page<Review> findPublicReviewsByReviewee(@Param("revieweeId") UUID revieweeId,
            @Param("direction") ReviewDirection direction, Pageable pageable);

    @Query("select r from Review r where r.serviceId = :serviceId and " + CLIENT_DIRECTION + " and " + PUBLIC)
    Page<Review> findPublicReviewsByService(@Param("serviceId") UUID serviceId, Pageable pageable);

    @Query("""
            select r from Review r where
            ((r.direction = com.workgo.trust.enumeration.ReviewDirection.CLIENT_TO_PROVIDER and r.reviewerId = :userId)
             or (r.direction = com.workgo.trust.enumeration.ReviewDirection.PROVIDER_TO_CLIENT and r.reviewerId = :providerId))
            and (:direction is null or r.direction = :direction)
            """)
    Page<Review> findMyReviews(@Param("userId") UUID userId, @Param("providerId") UUID providerId,
            @Param("direction") ReviewDirection direction, Pageable pageable);

    @Query("select avg(r.rating) as ratingAvg, count(r) as ratingCount from Review r where "
            + "r.revieweeId = :revieweeId and r.direction = :direction and " + PUBLIC)
    RatingAggregateProjection calculateRevieweeRatingStats(@Param("revieweeId") UUID revieweeId,
            @Param("direction") ReviewDirection direction);

    @Query("select avg(r.rating) as ratingAvg, count(r) as ratingCount from Review r where "
            + "r.serviceId = :serviceId and " + CLIENT_DIRECTION + " and " + PUBLIC)
    RatingAggregateProjection calculateServiceRatingStats(@Param("serviceId") UUID serviceId);

    @Query("""
            select r from Review r where r.isPublished = false
            and r.moderationStatus = com.workgo.trust.enumeration.ModerationStatus.APPROVED
            and r.publishEligibleAt <= :now order by r.publishEligibleAt, r.reviewId
            """)
    List<Review> findDueUnpublishedReviews(@Param("now") Instant now, Pageable limit);
}
