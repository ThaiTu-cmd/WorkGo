package com.workgo.identity.repository;

import com.workgo.identity.entity.ProviderVerification;
import com.workgo.identity.enumeration.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProviderVerificationRepository extends JpaRepository<ProviderVerification, UUID> {

    Page<ProviderVerification> findAllByProviderProfile_ProviderProfileId(UUID providerProfileId, Pageable pageable);

    Page<ProviderVerification> findAllByVerificationStatus(VerificationStatus status, Pageable pageable);

    boolean existsByProviderProfile_ProviderProfileIdAndVerificationStatus(
            UUID providerProfileId, VerificationStatus status);

    boolean existsByVerificationStatusAndProviderProfile_ProviderProfileId(VerificationStatus status, UUID id);
}