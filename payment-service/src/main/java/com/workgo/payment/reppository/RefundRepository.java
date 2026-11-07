package com.workgo.payment.reppository;

import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {

    Optional<Refund> findByPayment_PaymentId(UUID paymentId);

    boolean existsByPayment_PaymentId(UUID paymentId);

    List<Refund> findAllByOrderIdOrderByCreatedAtDesc(UUID orderId);

    List<Refund> findAllByStatus(RefundStatus status);

}
