package com.workgo.identity.repository;
import com.workgo.identity.entity.ProviderScoreReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ProviderScoreReviewRepository extends JpaRepository<ProviderScoreReview,UUID> {
    Optional<ProviderScoreReview> findByProviderIdAndReputationVersion(UUID provider,long version);
    List<ProviderScoreReview> findTop100ByProviderIdOrderByReviewedAtDesc(UUID provider);
}
