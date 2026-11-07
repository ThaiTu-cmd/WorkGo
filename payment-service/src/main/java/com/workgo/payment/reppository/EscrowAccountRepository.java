package com.workgo.payment.reppository;

import com.workgo.payment.entity.EscrowAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowAccountRepository extends JpaRepository<EscrowAccount, UUID> {

    Optional<EscrowAccount> findByOrderId(UUID orderId);

    boolean existsByOrderId(UUID orderId);

    Optional<EscrowAccount> findByPayment_PaymentId(UUID paymentId);

}
