package com.workgo.payment.reppository;

import com.workgo.payment.entity.EscrowAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowAccountRepository extends JpaRepository<EscrowAccount, UUID> {

    Optional<EscrowAccount> findByOrderId(UUID orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from EscrowAccount e where e.orderId = :orderId")
    Optional<EscrowAccount> findByOrderIdForUpdate(UUID orderId);

    boolean existsByOrderId(UUID orderId);

    Optional<EscrowAccount> findByPayment_PaymentId(UUID paymentId);

}
