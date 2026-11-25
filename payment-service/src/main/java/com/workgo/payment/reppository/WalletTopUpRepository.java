package com.workgo.payment.reppository;

import com.workgo.payment.entity.WalletTopUp;
import com.workgo.payment.enumeration.TopUpStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, UUID> {

    Optional<WalletTopUp> findByIdempotencyKey(String idempotencyKey);

    Optional<WalletTopUp> findByTopUpCode(String topUpCode);

    Optional<WalletTopUp> findByTopUpIdAndUserId(UUID topUpId, UUID userId);

    List<WalletTopUp> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<WalletTopUp> findAllByStatusAndExpiresAtBefore(TopUpStatus status, Instant now);

    List<WalletTopUp> findAllByStatusOrderByCreatedAtAsc(TopUpStatus status);

    @Query("select coalesce(sum(t.amount), 0) from WalletTopUp t where t.userId = :userId "
            + "and t.createdAt >= :from and t.currency = 'VND' and t.status <> :ignored")
    long sumAmountSince(UUID userId, Instant from, TopUpStatus ignored);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from WalletTopUp t where t.topUpId = :topUpId")
    Optional<WalletTopUp> findByIdForUpdate(UUID topUpId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from WalletTopUp t where t.topUpCode = :topUpCode")
    Optional<WalletTopUp> findByTopUpCodeForUpdate(String topUpCode);
}
