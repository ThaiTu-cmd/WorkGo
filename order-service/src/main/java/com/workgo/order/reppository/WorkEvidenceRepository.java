package com.workgo.order.reppository;

import com.workgo.order.entity.WorkEvidence;
import com.workgo.order.enumeration.EvidencePhase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WorkEvidenceRepository extends JpaRepository<WorkEvidence, UUID> {

    Page<WorkEvidence> findByExecution_ExecutionId(UUID executionId, Pageable pageable);

    Page<WorkEvidence> findByExecution_ExecutionIdAndPhase(UUID executionId, EvidencePhase phase, Pageable pageable);

    boolean existsByExecution_ExecutionIdAndPhase(UUID executionId, EvidencePhase phase);

}
