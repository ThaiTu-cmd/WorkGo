package com.workgo.order.reppository;
import com.workgo.order.entity.RewardCommitOutbox;import java.util.*;import org.springframework.data.jpa.repository.JpaRepository;
public interface RewardCommitOutboxRepository extends JpaRepository<RewardCommitOutbox,String>{Optional<RewardCommitOutbox> findFirstByOrderIdAndQuoteRef(UUID orderId,String quoteRef);List<RewardCommitOutbox> findTop50ByAcknowledgedFalseOrderByConfirmedAtAsc();}
