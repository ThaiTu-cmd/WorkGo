package com.workgo.identity.repository;
import com.workgo.identity.entity.SanctionProjection;import org.springframework.data.jpa.repository.*;import org.springframework.transaction.annotation.Transactional;import java.util.*;
public interface SanctionProjectionRepository extends JpaRepository<SanctionProjection,UUID>{
 @Transactional @Modifying @Query("update SanctionProjection p set p.jobSyncedVersion=:v where p.providerId=:id and p.jobSyncedVersion<:v")int jobAck(UUID id,long v);
 @Transactional @Modifying @Query("update SanctionProjection p set p.catalogSyncedVersion=:v where p.providerId=:id and p.catalogSyncedVersion<:v")int catalogAck(UUID id,long v);
 @Transactional @Modifying @Query("update SanctionProjection p set p.orderSyncedVersion=:v where p.providerId=:id and p.orderSyncedVersion<:v")int orderAck(UUID id,long v);
 @Transactional @Modifying @Query("update SanctionProjection p set p.lastError=:error where p.providerId=:id and p.sourceVersion=:v")int error(UUID id,long v,String error);
}
