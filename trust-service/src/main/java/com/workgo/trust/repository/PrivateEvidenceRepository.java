package com.workgo.trust.repository;

import com.workgo.trust.entity.PrivateEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrivateEvidenceRepository extends JpaRepository<PrivateEvidence, UUID> {
    List<PrivateEvidence> findByDisputeIdOrderByCreatedAtAsc(UUID disputeId);

    long countByDisputeIdAndUploaderId(UUID disputeId, UUID uploaderId);

    Optional<PrivateEvidence> findFirstByDisputeIdAndUploaderIdAndChecksumOrderByCreatedAtAsc(
            UUID disputeId, UUID uploaderId, String checksum);
}
