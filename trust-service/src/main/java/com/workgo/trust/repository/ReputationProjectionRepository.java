package com.workgo.trust.repository;
import com.workgo.trust.entity.ReputationProjection;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
public interface ReputationProjectionRepository extends JpaRepository<ReputationProjection,UUID> {
    @Query("select p from ReputationProjection p where p.identitySyncedVersion<p.sourceVersion or p.jobSyncedVersion<p.sourceVersion or p.catalogSyncedVersion<p.sourceVersion or p.orderSyncedVersion<p.sourceVersion") List<ReputationProjection> pending();
    @Transactional @Modifying @Query("update ReputationProjection p set p.identitySyncedVersion=:v where p.providerId=:id and p.identitySyncedVersion<:v") int identityAck(UUID id,long v);
    @Transactional @Modifying @Query("update ReputationProjection p set p.jobSyncedVersion=:v where p.providerId=:id and p.jobSyncedVersion<:v") int jobAck(UUID id,long v);
    @Transactional @Modifying @Query("update ReputationProjection p set p.catalogSyncedVersion=:v where p.providerId=:id and p.catalogSyncedVersion<:v") int catalogAck(UUID id,long v);
    @Transactional @Modifying @Query("update ReputationProjection p set p.orderSyncedVersion=:v where p.providerId=:id and p.orderSyncedVersion<:v") int orderAck(UUID id,long v);
    @Transactional @Modifying @Query("update ReputationProjection p set p.lastError=:error where p.providerId=:id and p.sourceVersion=:v") int error(UUID id,long v,String error);
}
