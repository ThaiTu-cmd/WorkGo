package com.workgo.payment.reppository;
import com.workgo.payment.entity.EscrowCommandReceipt;
import com.workgo.payment.enumeration.EscrowTxnType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface EscrowCommandReceiptRepository extends JpaRepository<EscrowCommandReceipt, UUID> {
    Optional<EscrowCommandReceipt> findByOrderIdAndDisputeIdAndOperation(UUID orderId, UUID disputeId, EscrowTxnType operation);
}
