package com.workgo.trust.repository;
import com.workgo.trust.entity.RewardCommitReceipt;import org.springframework.data.jpa.repository.JpaRepository;
public interface RewardCommitReceiptRepository extends JpaRepository<RewardCommitReceipt,String>{
 java.util.List<RewardCommitReceipt> findByOrderIdAndInputHash(java.util.UUID orderId,String inputHash);
}
