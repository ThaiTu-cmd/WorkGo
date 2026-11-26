package com.workgo.trust.service;
import com.workgo.trust.entity.*;import com.workgo.trust.repository.*;import com.workgo.trust.repository.client.IdentityClient;
import com.workgo.trust.utils.TokenUtils;import com.workgo.trust.exception.*;import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;import org.springframework.security.access.prepost.PreAuthorize;import java.util.*;
@Service @RequiredArgsConstructor
public class RewardReviewService {
    private final RewardReviewRepository reviews;private final RewardSnapshotRepository snapshots;
    private final TrustTransactions transactions;private final TrustOrderAccess orders;private final IdentityClient identity;
    private final ReputationService reputation;private final TokenUtils token;
    public void request(UUID order){transactions.locked(List.of("reward:"+order),()->{if(!reviews.existsById(order))reviews.saveAndFlush(new RewardReview(order));return null;});}
    @PreAuthorize("hasRole('ADMIN')")
    public RewardReview resolve(UUID order,int points,String reason,Long version){
        if(reason==null||reason.isBlank()||reason.length()>1000)throw new AppException(ErrorCode.INVALID_REQUEST);
        var snapshot=snapshots.findById(order).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
        var source=orders.snapshot(order);var profile=identity.getProviderProfile(source.providerId());
        if(profile==null)throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        if(token.getCurrentUserId().equals(source.clientId())||token.getCurrentUserId().equals(profile.userId()))throw new org.springframework.security.access.AccessDeniedException("Independent reward reviewer required");
        if(points<0||points>snapshot.getPoints()||!"COMPLETED".equals(source.orderStatus())||!Set.of("RELEASED","CASH_SETTLED").contains(source.paymentStatus()))throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        return transactions.locked(List.of("reward:"+order,"reputation:"+snapshot.getProviderId()),()->{
            var r=reviews.lock(order).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
            if(!"PENDING".equals(r.getStatus())){if(!Objects.equals(r.getApprovedPoints(),points)||!reason.trim().equals(r.getReason()))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);return r;}
            if(!Objects.equals(version,r.getVersion()))throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            r.setApprovedPoints(points);r.setReason(reason.trim());r.setReviewedBy(token.getCurrentUserId());r.setReviewedAt(java.time.Instant.now());r.setStatus("REVIEWED");
            reputation.reward(snapshot,points);return reviews.saveAndFlush(r);
        });
    }
}
