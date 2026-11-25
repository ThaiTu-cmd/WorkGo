package com.workgo.order.reppository;
import com.workgo.order.entity.OrderTimerNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;
public interface OrderTimerNoticeRepository extends JpaRepository<OrderTimerNotice,UUID> {
    List<OrderTimerNotice> findTop50ByAcknowledgedAtIsNullAndObsoleteFalseAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(Instant now);
    boolean existsByOrderIdAndSubmissionIdAndAcknowledgedAtIsNullAndObsoleteFalse(UUID orderId,String submissionId);
}
