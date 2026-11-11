package com.workgo.order.reppository;

import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.SourceType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findBySourceTypeAndSourceId(SourceType sourceType, UUID sourceId);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM orders WHERE source_type = 'PROPOSAL' AND source_id = :id)", nativeQuery = true)
    boolean existsProposalSourceIncludingDeleted(@Param("id") UUID proposalId);

    Page<Order> findAllByClientId(UUID clientId, Pageable pageable);

    Page<Order> findAllByProviderId(UUID providerId, Pageable pageable);

    List<Order> findTop50ByOrderStatusAndAutoCompleteAtLessThanEqualOrderByAutoCompleteAtAsc(
            OrderStatus orderStatus, Instant now);

    List<Order> findTop50ByOrderStatusAndPaymentStatusAndCompletedAtLessThanEqualOrderByCompletedAtAsc(
            OrderStatus orderStatus, PaymentStatus paymentStatus, Instant completedBefore);

    List<Order> findTop50ByOrderStatusAndPaymentStatusAndCancelledAtLessThanEqualOrderByCancelledAtAsc(
            OrderStatus orderStatus, PaymentStatus paymentStatus, Instant cancelledBefore);

    List<Order> findTop50ByOrderStatusAndCreatedAtLessThanEqualOrderByCreatedAtAsc(
            OrderStatus orderStatus, Instant createdBefore);
}
