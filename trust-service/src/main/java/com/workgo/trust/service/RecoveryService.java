package com.workgo.trust.service;
import com.workgo.trust.repository.client.*;import com.workgo.trust.exception.*;import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Service;import java.util.*;
@Service @RequiredArgsConstructor
public class RecoveryService {
    private final OrderClient orders;private final IdentityClient identity;private final PaymentClient payment;private final TrustOrderAccess access;
    private final ReputationService reputation;
    private final com.workgo.trust.repository.ReputationProjectionRepository projections;
    public record Approval(UUID providerId,UUID actorId,String reason){}
    public com.workgo.trust.entity.ReputationAccount complete(UUID provider,Approval req){
        if(req==null||!provider.equals(req.providerId())||req.actorId()==null||req.reason()==null||req.reason().isBlank()||req.reason().length()>900)throw new AppException(ErrorCode.INVALID_REQUEST);
        var stats=orders.admissionStats(provider);var account=identity.getProviderProfile(provider);
        if(stats==null||!provider.equals(stats.providerId())||stats.activeOrders()!=0||stats.successfulRecoveries()==null||account==null)throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        var funds=payment.eligibility(provider);
        if(funds==null||!account.userId().equals(funds.userId())||funds.outstandingFee()!=0||!funds.mayStartNewWork())throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        var current=projections.findById(provider).orElseThrow(()->new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE));
        var buyers=new HashSet<UUID>();var grants=new TreeSet<String>();
        var verified=new ArrayList<Map.Entry<OrderClient.RecoverySuccess,Long>>();
        for(var s:stats.successfulRecoveries()){
            var order=access.snapshot(s.orderId());var grant=identity.recoveryGrant(s.recoveryGrantId());var agreement=orders.rewardAgreement(s.orderId());
            if(req.actorId().equals(order.clientId())||req.actorId().equals(account.userId())||grant==null||!provider.equals(grant.providerId())||!s.recoveryGrantId().equals(grant.id())||!provider.equals(order.providerId())||!s.clientId().equals(order.clientId())
                    ||!"COMPLETED".equals(order.orderStatus())||!Set.of("RELEASED","CASH_SETTLED").contains(order.paymentStatus())||agreement==null||!s.recoveryGrantId().equals(agreement.recoveryGrantId())
                    ||order.placedAt()==null||grant.approvedAt().isAfter(order.placedAt())||grant.expiresAt().isBefore(order.placedAt()))throw new AppException(ErrorCode.INVALID_REQUEST);
            verified.add(Map.entry(s,grant.reputationVersion()));
        }
        long newest=verified.stream().mapToLong(Map.Entry::getValue).max().orElse(-1);
        if(current.getScore()<20&&current.getSourceVersion()!=newest)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        for(var e:verified)if(e.getValue()==newest&&buyers.add(e.getKey().clientId()))grants.add(e.getKey().recoveryGrantId().toString());
        if(buyers.size()<2||grants.size()<2)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        return reputation.recover(provider,grants,req.actorId(),req.reason());
    }
}
