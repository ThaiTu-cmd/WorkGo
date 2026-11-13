package com.workgo.job.repository;

import com.workgo.job.entity.ProposalOrderOutbox;
import com.workgo.job.enumeration.OrderSyncStatus;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ProposalOrderOutboxRepository extends JpaRepository<ProposalOrderOutbox, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from ProposalOrderOutbox o where o.proposalId = :id")
    Optional<ProposalOrderOutbox> findLockedById(@Param("id") UUID id);

    @Query("select o.proposalId from ProposalOrderOutbox o where o.status in :states and o.nextAttemptAt <= :now order by o.nextAttemptAt, o.proposalId")
    List<UUID> findDue(@Param("states") Collection<OrderSyncStatus> states, @Param("now") Instant now, Pageable page);
}
