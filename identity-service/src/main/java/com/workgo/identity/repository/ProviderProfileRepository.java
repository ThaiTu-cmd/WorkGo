package com.workgo.identity.repository;

import com.workgo.identity.entity.ProviderProfile;
import com.workgo.identity.enumeration.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, UUID> {

    Optional<ProviderProfile> findByUser_UserId(UUID userId);

    boolean existsByUser_UserId(UUID userId);

    Page<ProviderProfile> findAllByVerificationStatus(VerificationStatus status, Pageable pageable);

}
