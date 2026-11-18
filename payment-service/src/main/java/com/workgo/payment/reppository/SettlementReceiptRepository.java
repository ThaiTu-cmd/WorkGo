package com.workgo.payment.reppository;

import com.workgo.payment.entity.SettlementReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementReceiptRepository extends JpaRepository<SettlementReceipt, UUID> {

    Optional<SettlementReceipt> findByDecisionId(UUID decisionId);

    boolean existsByOrderId(UUID orderId);
}
