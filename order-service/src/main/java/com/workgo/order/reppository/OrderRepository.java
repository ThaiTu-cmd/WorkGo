package com.workgo.order.reppository;

import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderPaymentMethod;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.SourceType;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query(value = "SELECT * FROM orders WHERE client_id = :clientId AND idempotency_key = :key", nativeQuery = true)
    Optional<Order> findCreationIncludingDeleted(@Param("clientId") UUID clientId, @Param("key") String key);

    Optional<Order> findBySourceTypeAndSourceId(SourceType sourceType, UUID sourceId);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM orders WHERE source_type = 'PROPOSAL' AND source_id = :id)", nativeQuery = true)
    boolean existsProposalSourceIncludingDeleted(@Param("id") UUID proposalId);

    Page<Order> findByOrderStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByInputSupportReasonIsNotNullAndOrderStatus(OrderStatus status, Pageable pageable);

    Page<Order> findAllByClientId(UUID clientId, Pageable pageable);

    Page<Order> findAllByProviderId(UUID providerId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.orderId = :orderId")
    Optional<Order> findByIdForUpdate(@Param("orderId") UUID orderId);

    long countByProviderIdAndPaymentMethodAndOrderStatusNotIn(
            UUID providerId, OrderPaymentMethod paymentMethod, Collection<OrderStatus> orderStatuses);

    List<Order> findTop50ByOrderStatusAndAutoCompleteAtLessThanEqualOrderByAutoCompleteAtAsc(
            OrderStatus orderStatus, Instant now);

    List<Order> findTop50ByOrderStatusAndPaymentStatusAndCompletedAtLessThanEqualOrderByCompletedAtAsc(
            OrderStatus orderStatus, PaymentStatus paymentStatus, Instant completedBefore);

    List<Order> findTop50ByOrderStatusAndPaymentStatusAndCancelledAtLessThanEqualOrderByCancelledAtAsc(
            OrderStatus orderStatus, PaymentStatus paymentStatus, Instant cancelledBefore);

    List<Order> findTop50ByOrderStatusAndCreatedAtLessThanEqualOrderByCreatedAtAsc(
            OrderStatus orderStatus, Instant createdBefore);

    @Query("SELECT o FROM Order o WHERE (:status IS NULL OR o.orderStatus = :status) " +
            "AND (:executionType IS NULL OR o.executionType = :executionType) " +
            "AND (:clientId IS NULL OR o.clientId = :clientId) " +
            "AND (:providerId IS NULL OR o.providerId = :providerId) " +
            "AND (cast(:from AS timestamp) IS NULL OR o.createdAt >= :from) " +
            "AND (cast(:to AS timestamp) IS NULL OR o.createdAt < :to)")
    Page<Order> searchForMonitoring(@Param("status") OrderStatus status,
                                    @Param("executionType") ExecutionType executionType,
                                    @Param("clientId") UUID clientId,
                                    @Param("providerId") UUID providerId,
                                    @Param("from") Instant from,
                                    @Param("to") Instant to,
                                    Pageable pageable);
}
