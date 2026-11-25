package com.workgo.payment.reppository;

import com.workgo.payment.entity.FeeReminder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.Pageable;
import java.time.Instant;
import java.util.*;

public interface FeeReminderRepository extends JpaRepository<FeeReminder, UUID> {
    List<FeeReminder> findByDeliveredAtIsNullAndCancelledAtIsNullAndDueAtLessThanEqualOrderByDueAtAsc(
            Instant now, Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from FeeReminder r where r.id = :id")
    Optional<FeeReminder> findLockedById(UUID id);
}
