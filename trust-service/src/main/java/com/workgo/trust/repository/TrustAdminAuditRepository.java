package com.workgo.trust.repository;
import com.workgo.trust.entity.TrustAdminAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.UUID;
public interface TrustAdminAuditRepository extends org.springframework.data.repository.Repository<TrustAdminAudit,UUID> {
    Page<TrustAdminAudit> findByTargetId(UUID targetId, Pageable pageable);
    TrustAdminAudit save(TrustAdminAudit record);
    @org.springframework.data.jpa.repository.Query("select l from TrustAdminAudit l where (:scopeId is null or l.actorId=:scopeId or (l.targetType='DISPUTE' and exists (select d.disputeId from Dispute d where d.disputeId=l.targetId and d.assignedAdminId=:scopeId and d.clientId<>:scopeId and d.openedBy<>:scopeId))) and (:actorId is null or l.actorId=:actorId) and (:targetId is null or l.targetId=:targetId) and (:action is null or l.action=:action) and (:targetType is null or l.targetType=:targetType) and (cast(:from as timestamp) is null or l.createdAt>=:from) and (cast(:to as timestamp) is null or l.createdAt<:to)")
    Page<TrustAdminAudit> search(@org.springframework.data.repository.query.Param("scopeId") UUID scopeId, @org.springframework.data.repository.query.Param("actorId") UUID actorId,
        @org.springframework.data.repository.query.Param("targetId") UUID targetId,
        @org.springframework.data.repository.query.Param("action") String action,
        @org.springframework.data.repository.query.Param("targetType") String targetType,
        @org.springframework.data.repository.query.Param("from") java.time.Instant from,
        @org.springframework.data.repository.query.Param("to") java.time.Instant to, Pageable page);
}
