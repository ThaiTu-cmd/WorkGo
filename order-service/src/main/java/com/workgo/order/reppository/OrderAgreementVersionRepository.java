package com.workgo.order.reppository;

import com.workgo.order.entity.OrderAgreementVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderAgreementVersionRepository extends JpaRepository<OrderAgreementVersion, UUID> {

    Optional<OrderAgreementVersion> findTopByOrderIdOrderByVersionNoDesc(UUID orderId);

    List<OrderAgreementVersion> findAllByOrderIdOrderByVersionNoAsc(UUID orderId);
}
