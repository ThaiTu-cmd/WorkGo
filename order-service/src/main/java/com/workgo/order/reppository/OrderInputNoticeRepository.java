package com.workgo.order.reppository;
import com.workgo.order.entity.OrderInputNotice;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
public interface OrderInputNoticeRepository extends JpaRepository<OrderInputNotice,UUID> {
    List<OrderInputNotice> findTop50ByAcknowledgedAtIsNullAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(Instant now);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select n from OrderInputNotice n where n.id=:id")
    Optional<OrderInputNotice> lock(@org.springframework.data.repository.query.Param("id") UUID id);
}
