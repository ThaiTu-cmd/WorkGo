package com.workgo.catalog.repository;

import com.workgo.catalog.entity.ProviderFinancialRestriction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderFinancialRestrictionRepository extends JpaRepository<ProviderFinancialRestriction, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ProviderFinancialRestriction r where r.providerId = :providerId")
    Optional<ProviderFinancialRestriction> findByIdForUpdate(UUID providerId);

    boolean existsByProviderIdAndRestrictedTrue(UUID providerId);

}
