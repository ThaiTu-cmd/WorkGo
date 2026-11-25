package com.workgo.job.repository;

import com.workgo.job.entity.JobAdminAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.UUID;
public interface JobAdminAuditRepository extends org.springframework.data.repository.Repository<JobAdminAudit,UUID> {
    Page<JobAdminAudit> findByTargetId(UUID targetId, Pageable pageable);
    JobAdminAudit save(JobAdminAudit record);
    @org.springframework.data.jpa.repository.Query("select l from JobAdminAudit l where (:actorId is null or l.actorId=:actorId) and (:targetId is null or l.targetId=:targetId) and (:action is null or l.action=:action) and (:targetType is null or l.targetType=:targetType) and (cast(:from as timestamp) is null or l.createdAt>=:from) and (cast(:to as timestamp) is null or l.createdAt<:to)")
    Page<JobAdminAudit> search(@org.springframework.data.repository.query.Param("actorId") UUID actorId,
        @org.springframework.data.repository.query.Param("targetId") UUID targetId,
        @org.springframework.data.repository.query.Param("action") String action,
        @org.springframework.data.repository.query.Param("targetType") String targetType,
        @org.springframework.data.repository.query.Param("from") java.time.Instant from,
        @org.springframework.data.repository.query.Param("to") java.time.Instant to, Pageable page);
}
