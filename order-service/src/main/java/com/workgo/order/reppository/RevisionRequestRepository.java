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

}
