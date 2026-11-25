package com.workgo.trust.repository;

import com.workgo.trust.entity.Dispute;
import com.workgo.trust.enumeration.DisputeStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface DisputeRepository extends JpaRepository<Dispute, UUID>, JpaSpecificationExecutor<Dispute> {
    Optional<Dispute> findByOrderIdAndActiveSlot(UUID orderId, Integer activeSlot);
    List<Dispute> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    @Query("""
            select d from Dispute d where (d.clientId = :clientId or d.providerId = :providerId)
            and (:status is null or d.status = :status)
            """)
    Page<Dispute> findMyDisputes(@Param("clientId") UUID clientId, @Param("providerId") UUID providerId,
            @Param("status") DisputeStatus status, Pageable pageable);
}
