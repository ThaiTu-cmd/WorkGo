package com.workgo.trust.repository;
import com.workgo.trust.entity.TrustAdminAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.UUID;
public interface TrustAdminAuditRepository extends JpaRepository<TrustAdminAudit,UUID> {
    Page<TrustAdminAudit> findByTargetId(UUID targetId, Pageable pageable);
}
