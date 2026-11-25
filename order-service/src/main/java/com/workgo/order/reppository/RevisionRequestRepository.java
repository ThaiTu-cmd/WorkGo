package com.workgo.order.reppository;

import com.workgo.order.entity.RevisionRequest;
import com.workgo.order.enumeration.RevisionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevisionRequestRepository extends JpaRepository<RevisionRequest, UUID> {

    List<RevisionRequest> findByDeliveryPackage_Execution_ExecutionIdOrderByCreatedAtDesc(
            UUID executionId);

    Optional<RevisionRequest> findFirstByDeliveryPackage_Execution_ExecutionIdAndStatusOrderByCreatedAtDesc(
            UUID executionId, RevisionStatus status);

    @org.springframework.data.jpa.repository.Query("""
        select r from RevisionRequest r
        where r.deliveryPackage.execution.order.orderStatus = com.workgo.order.enumeration.OrderStatus.IN_PROGRESS
          and r.status in (com.workgo.order.enumeration.RevisionStatus.OPEN, com.workgo.order.enumeration.RevisionStatus.RESPONDED)
          and ((r.respondedAt is null and r.responseDueAt <= :now)
            or (r.agreedRepairDeadline is null and r.deadlineAgreementDueAt <= :now))
        order by r.createdAt asc
        """)
    Page<RevisionRequest> findSupportQueue(@org.springframework.data.repository.query.Param("now") java.time.Instant now, Pageable pageable);
}
