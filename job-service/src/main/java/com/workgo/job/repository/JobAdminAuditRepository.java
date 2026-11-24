package com.workgo.job.repository;

import com.workgo.job.entity.JobAdminAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.UUID;
public interface JobAdminAuditRepository extends JpaRepository<JobAdminAudit,UUID> {
    Page<JobAdminAudit> findByTargetId(UUID targetId, Pageable pageable);
}
