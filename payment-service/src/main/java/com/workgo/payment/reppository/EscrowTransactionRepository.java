package com.workgo.payment.reppository;

import com.workgo.payment.entity.EscrowTransaction;
import com.workgo.payment.enumeration.EscrowTxnType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface EscrowTransactionRepository extends JpaRepository<EscrowTransaction, UUID> {

    List<EscrowTransaction> findByEscrowAccount_EscrowAccountIdOrderByCreatedAtAsc(UUID escrowAccountId);

    boolean existsByEscrowAccount_EscrowAccountIdAndTxnType(UUID escrowAccountId, EscrowTxnType txnType);

}
