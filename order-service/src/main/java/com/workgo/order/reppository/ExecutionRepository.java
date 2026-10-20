package com.workgo.order.reppository;

import com.workgo.order.entity.Execution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, UUID> {

    Optional<Execution> findByOrder_OrderId(UUID orderId);

    boolean existsByOrder_OrderId(UUID orderId);

}
