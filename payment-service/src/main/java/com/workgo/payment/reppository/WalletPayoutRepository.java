package com.workgo.payment.reppository;

import com.workgo.payment.entity.WalletPayout;
import com.workgo.payment.enumeration.PayoutStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletPayoutRepository extends JpaRepository<WalletPayout, UUID> {

    Optional<WalletPayout> findByIdempotencyKey(String idempotencyKey);

    Optional<WalletPayout> findByPayoutIdAndUserId(UUID payoutId, UUID userId);

    List<WalletPayout> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<WalletPayout> findAllByStatusOrderByCreatedAtAsc(PayoutStatus status);

    List<WalletPayout> findAllByStatusAndProcessingAtBefore(PayoutStatus status, Instant before);

    @Query("select coalesce(sum(p.amount), 0) from WalletPayout p where p.userId = :userId "
            + "and p.createdAt >= :from and p.status not in :ignored")
    long sumAmountSince(UUID userId, Instant from, Collection<PayoutStatus> ignored);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from WalletPayout p where p.payoutId = :payoutId")
    Optional<WalletPayout> findByIdForUpdate(UUID payoutId);
}
