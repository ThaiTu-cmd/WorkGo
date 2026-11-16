package com.workgo.trust.repository;

import com.workgo.trust.entity.TrustOutboxEvent;
import com.workgo.trust.enumeration.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface TrustOutboxEventRepository extends JpaRepository<TrustOutboxEvent, UUID> {
    List<TrustOutboxEvent> findByStatusAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAscCreatedAtAsc(
            OutboxStatus status, Instant now, Pageable limit);
}
