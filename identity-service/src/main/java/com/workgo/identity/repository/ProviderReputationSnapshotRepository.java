package com.workgo.identity.repository;
import com.workgo.identity.entity.ProviderReputationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ProviderReputationSnapshotRepository extends JpaRepository<ProviderReputationSnapshot,UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from ProviderReputationSnapshot p where p.providerId=:id")
    java.util.Optional<ProviderReputationSnapshot> lockByProviderId(@org.springframework.data.repository.query.Param("id") UUID id);
    @org.springframework.data.jpa.repository.Query("select p from ProviderReputationSnapshot p where p.score between 0 and 4 and not exists(select r.id from ProviderScoreReview r where r.providerId=p.providerId and r.reputationVersion=p.sourceVersion) order by p.lowScoreSince asc")
    java.util.List<ProviderReputationSnapshot> pendingScoreReviews(org.springframework.data.domain.Pageable limit);
}
