package com.workgo.payment.reppository;

import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findByPaymentCode(String paymentCode);

    List<Payment> findAllByOrderIdOrderByCreatedAtDesc(UUID orderId);

    List<Payment> findAllByOrderIdAndPayerIdOrderByCreatedAtDesc(UUID orderId, UUID payerId);

    Optional<Payment> findFirstByOrderIdAndStatusInOrderByCreatedAtDesc(
            UUID orderId, Collection<PaymentStatus> statuses);

    List<Payment> findAllByStatusInAndExpiresAtBefore(Collection<PaymentStatus> statuses, Instant now);

    List<Payment> findAllByStatusAndOrderSyncStatusAndOrderSyncRetryCountLessThan(
            PaymentStatus status, OrderSyncStatus orderSyncStatus, int maxRetry);

}
