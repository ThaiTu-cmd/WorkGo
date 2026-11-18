package com.workgo.identity.repository;

import com.workgo.identity.entity.VerificationDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, UUID> {

    List<VerificationDocument> findAllByVerification_ProviderVerificationIdOrderByCreatedAtAsc(UUID verificationId);

    long countByVerification_ProviderVerificationId(UUID verificationId);
}
