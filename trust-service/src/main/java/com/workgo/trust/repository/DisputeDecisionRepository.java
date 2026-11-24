package com.workgo.trust.repository;
import com.workgo.trust.entity.DisputeDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.time.Instant;
import java.util.*;
public interface DisputeDecisionRepository extends JpaRepository<DisputeDecision,UUID> {
    Optional<DisputeDecision> findByDisputeId(UUID id);
    boolean existsBySupersedesDecisionId(UUID id);
    List<DisputeDecision> findByExecutionStatusAndNextAttemptAtLessThanEqual(String status,Instant now,Pageable limit);
}
