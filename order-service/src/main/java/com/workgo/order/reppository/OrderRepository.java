package com.workgo.order.reppository;

import com.workgo.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findAllByClientId(UUID clientId, Pageable pageable);

    Page<Order> findAllByProviderId(UUID providerId, Pageable pageable);

}
