package com.workgo.trust.repository;

import com.workgo.trust.entity.Report;
import com.workgo.trust.enumeration.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(UUID reporterId, ReportTargetType targetType,
            UUID targetId, Collection<ReportStatus> activeStatuses);

    @Query("""
            select r from Report r where r.reporterId = :reporterId
            and (:status is null or r.status = :status)
            and (:targetType is null or r.targetType = :targetType)
            """)
    Page<Report> findMyReports(@Param("reporterId") UUID reporterId, @Param("status") ReportStatus status,
            @Param("targetType") ReportTargetType targetType, Pageable pageable);
}
