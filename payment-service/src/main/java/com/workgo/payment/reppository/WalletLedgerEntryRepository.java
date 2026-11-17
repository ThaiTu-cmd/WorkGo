package com.workgo.payment.reppository;

import com.workgo.payment.entity.WalletLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, UUID> {

    @Query("select coalesce(sum(e.amount), 0) from WalletLedgerEntry e")
    long sumAllAmounts();

    @Query("select coalesce(sum(e.amount), 0) from WalletLedgerEntry e where e.account.walletAccountId = :walletAccountId")
    long sumAmountsOfAccount(UUID walletAccountId);
}
