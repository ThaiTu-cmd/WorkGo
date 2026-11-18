package com.workgo.payment.reppository;

import com.workgo.payment.entity.FinancialRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface FinancialRestrictionRepository extends JpaRepository<FinancialRestriction, UUID> {

    @Query("select r from FinancialRestriction r where r.identitySyncedVersion < r.version "
            + "or r.catalogSyncedVersion < r.version order by r.updatedAt asc")
    List<FinancialRestriction> findAllPendingSync();

    //chi danh dau dung version da gui: trong luc gui ma doi tiep thi van con cho gui
    @Transactional
    @Modifying
    @Query("update FinancialRestriction r set r.identitySyncedVersion = :version, r.providerId = :providerId, "
            + "r.syncedAt = :now where r.userId = :userId and r.identitySyncedVersion < :version")
    int markIdentitySynced(UUID userId, long version, UUID providerId, Instant now);

    @Transactional
    @Modifying
    @Query("update FinancialRestriction r set r.catalogSyncedVersion = :version, r.syncedAt = :now "
            + "where r.userId = :userId and r.catalogSyncedVersion < :version")
    int markCatalogSynced(UUID userId, long version, Instant now);
}
