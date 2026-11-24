package com.workgo.trust.repository;
import com.workgo.trust.entity.PrivateEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PrivateEvidenceRepository extends JpaRepository<PrivateEvidence,UUID>{
    List<PrivateEvidence> findByDisputeIdOrderByCreatedAtAsc(UUID disputeId);
    long countByDisputeIdAndUploaderId(UUID disputeId,UUID uploaderId);
}
