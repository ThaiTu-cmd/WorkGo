package com.workgo.order.reppository;

import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findAllByClientId(UUID clientId, Pageable pageable);

    Page<Order> findAllByProviderId(UUID providerId, Pageable pageable);

    List<Order> findTop50ByOrderStatusAndAutoCompleteAtLessThanEqualOrderByAutoCompleteAtAsc(
            OrderStatus orderStatus, Instant now);
}
