package com.workgo.payment.reppository;

import com.workgo.payment.entity.WalletAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletAccountRepository extends JpaRepository<WalletAccount, UUID> {

    Optional<WalletAccount> findByAccountTypeAndOwnerKey(String accountType, String ownerKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from WalletAccount a where a.walletAccountId = :walletAccountId")
    Optional<WalletAccount> findByIdForUpdate(UUID walletAccountId);
}
