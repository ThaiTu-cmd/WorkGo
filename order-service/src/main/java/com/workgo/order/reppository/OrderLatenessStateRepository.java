package com.workgo.order.reppository;

import com.workgo.order.entity.OrderLatenessState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderLatenessStateRepository extends JpaRepository<OrderLatenessState, UUID> {
}
