package com.workgo.payment.reppository;
import com.workgo.payment.entity.CashDecisionReceipt;import org.springframework.data.jpa.repository.*;import jakarta.persistence.LockModeType;import java.util.*;
public interface CashDecisionReceiptRepository extends JpaRepository<CashDecisionReceipt,UUID>{
 Optional<CashDecisionReceipt> findByOrderId(UUID order);
 @Lock(LockModeType.PESSIMISTIC_WRITE)@Query("select r from CashDecisionReceipt r where r.decisionId=:id")Optional<CashDecisionReceipt> lock(UUID id);
}
