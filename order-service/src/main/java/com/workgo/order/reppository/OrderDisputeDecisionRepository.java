package com.workgo.order.reppository;

import com.workgo.order.entity.OrderDisputeDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderDisputeDecisionRepository extends JpaRepository<OrderDisputeDecision, UUID> {

    Optional<OrderDisputeDecision> findByDecisionId(UUID decisionId);

    boolean existsByOrderId(UUID orderId);
}
