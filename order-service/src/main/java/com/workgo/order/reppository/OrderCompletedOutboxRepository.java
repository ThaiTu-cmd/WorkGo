package com.workgo.order.reppository;

import com.workgo.order.entity.OrderCompletedOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface OrderCompletedOutboxRepository extends JpaRepository<OrderCompletedOutbox, String> {
    @Query("select e.eventId from OrderCompletedOutbox e where e.status in ('PENDING','SENDING') and e.nextAttemptAt <= :now order by e.nextAttemptAt")
    List<String> due(@Param("now") Instant now, Pageable page);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update OrderCompletedOutbox e set e.status='SENDING', e.claimToken=:token, e.attempts=e.attempts+1, e.nextAttemptAt=:lease where e.eventId=:id and e.status in ('PENDING','SENDING') and e.nextAttemptAt<=:now and e.attempts<:max")
    int claim(@Param("id") String id, @Param("token") UUID token, @Param("now") Instant now,
              @Param("lease") Instant lease, @Param("max") int max);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update OrderCompletedOutbox e set e.status='FAILED', e.lastError='Retry limit exhausted after expired claim', e.claimToken=null where e.status='SENDING' and e.nextAttemptAt<=:now and e.attempts>=:max")
    int failExpired(@Param("now") Instant now, @Param("max") int max);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update OrderCompletedOutbox e set e.status=:status, e.nextAttemptAt=:next, e.lastError=:error, e.claimToken=null where e.eventId=:id and e.claimToken=:token and e.status='SENDING'")
    int finish(@Param("id") String id, @Param("token") UUID token, @Param("status") String status,
               @Param("next") Instant next, @Param("error") String error);
}
