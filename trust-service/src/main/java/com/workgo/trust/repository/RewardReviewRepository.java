package com.workgo.trust.repository;
import com.workgo.trust.entity.RewardReview;import org.springframework.data.jpa.repository.*;import jakarta.persistence.LockModeType;import java.util.*;
public interface RewardReviewRepository extends JpaRepository<RewardReview,UUID>{
    List<RewardReview> findTop100ByStatusOrderByDueAtAsc(String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select r from RewardReview r where r.orderId=:id")Optional<RewardReview> lock(UUID id);
}
