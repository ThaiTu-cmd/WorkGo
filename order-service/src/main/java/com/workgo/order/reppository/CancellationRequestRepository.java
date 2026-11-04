package com.workgo.order.reppository;

import com.workgo.order.entity.CancellationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CancellationRequestRepository extends JpaRepository<CancellationRequest, UUID> {

    boolean existsByOrder_OrderId(UUID orderId);

    Optional<CancellationRequest> findByOrder_OrderId(UUID orderId);

}
