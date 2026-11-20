package com.workgo.identity.repository;

import com.workgo.identity.entity.AdminActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AdminActionLogRepository extends Repository<AdminActionLog, UUID> {

    AdminActionLog save(AdminActionLog adminActionLog);

    List<AdminActionLog> findAllByTargetTypeAndTargetIdOrderByCreatedAtAsc(String targetType, String targetId);

    @Query("SELECT l FROM AdminActionLog l WHERE (:actorId IS NULL OR l.actorId = :actorId) " +
            "AND (:action IS NULL OR l.action = :action) " +
            "AND (:targetType IS NULL OR l.targetType = :targetType) " +
            "AND (:targetId IS NULL OR l.targetId = :targetId) " +
            "AND (cast(:from AS timestamp) IS NULL OR l.createdAt >= :from) " +
            "AND (cast(:to AS timestamp) IS NULL OR l.createdAt < :to)")
    Page<AdminActionLog> search(@Param("actorId") UUID actorId,
                                @Param("action") String action,
                                @Param("targetType") String targetType,
                                @Param("targetId") String targetId,
                                @Param("from") Instant from,
                                @Param("to") Instant to,
                                Pageable pageable);
}
