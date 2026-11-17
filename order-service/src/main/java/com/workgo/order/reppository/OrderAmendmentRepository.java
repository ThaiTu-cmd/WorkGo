package com.workgo.order.reppository;

import com.workgo.order.entity.OrderAmendment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderAmendmentRepository extends JpaRepository<OrderAmendment, UUID> {

    boolean existsByOrderIdAndStatus(UUID orderId, String status);

    List<OrderAmendment> findAllByOrderIdOrderByCreatedAtDesc(UUID orderId);

    Optional<OrderAmendment> findByAmendmentIdAndOrderId(UUID amendmentId, UUID orderId);
}
