package com.workgo.trust.service;
import com.workgo.trust.entity.*;
import com.workgo.trust.repository.RewardSnapshotRepository;
import com.workgo.trust.exception.*;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
@Service @RequiredArgsConstructor
public class RewardService {
    private final RewardSnapshotRepository snapshots;
    private final TrustOrderAccess orders;
    private final TrustTransactions transactions;
    private final ReputationService reputation;
    private final RewardReviewService reviews;
    public record SnapshotRequest(@NotNull UUID orderId,boolean complexScope,@Min(1) @Max(36500) int estimatedDays,
            boolean integration,Integer aiPoints,@Size(max=100) String modelVersion,@Size(max=20000) String description){}
    public RewardSnapshot lock(SnapshotRequest req){
        var order=orders.snapshot(req.orderId());
        var quote=RewardPolicy.evaluate(req.description(),req.complexScope(),req.estimatedDays(),req.integration(),req.aiPoints(),req.modelVersion());
        var result=transactions.locked(List.of("reward:"+req.orderId()),()->{
            var old=snapshots.findById(req.orderId()).orElse(null);
            if(old!=null){if(!old.getInputHash().equals(quote.inputHash()))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);return old;}
            if(!"CONFIRMED".equals(order.orderStatus()))throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            return snapshots.saveAndFlush(new RewardSnapshot(req.orderId(),order.providerId(),order.clientId(),quote));
        });
        if(result.isNeedsReview())reviews.request(req.orderId());
        return result;
    }
    public ReputationAccount grant(UUID orderId){
        var snapshot=snapshots.findById(orderId).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
        var order=orders.snapshot(orderId);
        if(!snapshot.getProviderId().equals(order.providerId())||!snapshot.getClientId().equals(order.clientId())||snapshot.isNeedsReview()
                ||!"COMPLETED".equals(order.orderStatus())||!Set.of("RELEASED","CASH_SETTLED").contains(order.paymentStatus())
                ||order.completedAt()==null||order.completedAt().isBefore(snapshot.getLockedAt()))throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        return reputation.reward(snapshot);
    }
}
