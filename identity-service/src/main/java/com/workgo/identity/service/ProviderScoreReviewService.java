package com.workgo.identity.service;
import com.workgo.identity.entity.*;
import com.workgo.identity.repository.*;
import com.workgo.identity.Exception.*;
import com.workgo.identity.enumeration.AdminActionType;
import com.workgo.identity.service.admin.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class ProviderScoreReviewService {
    private final ProviderScoreReviewRepository reviews;
    private final ProviderReputationSnapshotRepository reputation;
    private final InternalProviderProfileRepository profiles;
    private final ProviderSanctionService sanctions;
    private final AdminAuditService audit;
    public record Command(Long expectedReputationVersion,String outcome,String reason,String reference){}
    public record Pending(UUID providerId,int score,long sourceVersion,Instant lowScoreSince){}
    public record Receipt(UUID reviewId,UUID providerId,int score,long sourceVersion,String outcome,String reason,String reference,Instant reviewedAt,UUID sanctionId){}

    @Transactional(readOnly=true) @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<Pending> pending(){return reputation.pendingScoreReviews(org.springframework.data.domain.PageRequest.of(0,100)).stream().map(p->new Pending(p.getProviderId(),p.getScore(),p.getSourceVersion(),p.getLowScoreSince())).toList();}

    @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Receipt review(UUID provider,Command request){
        if(request==null||request.expectedReputationVersion()==null||request.outcome()==null||!Set.of("KEEP_RESTRICTED","BAN_PROVIDER").contains(request.outcome())
                ||request.reason()==null||request.reason().isBlank()||request.reason().length()>1000||request.reference()==null||request.reference().isBlank()||request.reference().length()>200)
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        sanctions.requireSuperActor();
        var profile=profiles.findById(provider).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        if(profile.userId().equals(sanctions.actor()))throw new AccessDeniedException("Independent score reviewer required");
        profiles.lockFinancialRestriction(profile.userId()).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        var score=reputation.lockByProviderId(provider).orElseThrow(()->new AppException(ErrorCode.INVALID_STATE_TRANSITION));
        String reason=request.reason().strip(),reference=request.reference().strip();
        var old=reviews.findByProviderIdAndReputationVersion(provider,request.expectedReputationVersion()).orElse(null);
        if(old!=null){
            if(!old.getOutcome().equals(request.outcome())||!old.getReason().equals(reason)||!old.getReference().equals(reference))throw new AppException(ErrorCode.STALE_VERSION);
            return receipt(old);
        }
        if(score.getSourceVersion()!=request.expectedReputationVersion())throw new AppException(ErrorCode.STALE_VERSION);
        if(score.getScore()<0||score.getScore()>4)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        if("BAN_PROVIDER".equals(request.outcome())&&!"ACTIVE".equals(profile.userStatus()))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        UUID sanction=null;
        if("BAN_PROVIDER".equals(request.outcome()))sanction=sanctions.create(provider,new ProviderSanctionService.Create("PROVIDER",reason,reference,Instant.now(),null)).getId();
        var result=reviews.saveAndFlush(new ProviderScoreReview(UUID.randomUUID(),provider,profile.userId(),sanctions.actor(),score.getScore(),score.getSourceVersion(),request.outcome(),reason,reference,sanction));
        audit.record(AdminAction.builder().action(AdminActionType.PROVIDER_SANCTION_UPDATED).targetType("PROVIDER_SCORE_REVIEW").targetId(result.getId()).reason(reason)
                .beforeState(Map.of("score",score.getScore(),"reputationVersion",score.getSourceVersion()))
                .afterState(Map.of("providerId",provider,"outcome",request.outcome(),"reference",reference,"newWorkGranted",false)).build());
        return receipt(result);
    }

    @Transactional(readOnly=true)
    public List<Receipt> history(UUID provider){
        var profile=profiles.findById(provider).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        var auth=SecurityContextHolder.getContext().getAuthentication();
        boolean root=auth!=null&&auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if(!root&&!profile.userId().equals(sanctions.actor()))throw new AccessDeniedException("Provider review owner required");
        return reviews.findTop100ByProviderIdOrderByReviewedAtDesc(provider).stream().map(this::receipt).toList();
    }
    private Receipt receipt(ProviderScoreReview r){return new Receipt(r.getId(),r.getProviderId(),r.getScore(),r.getReputationVersion(),r.getOutcome(),r.getReason(),r.getReference(),r.getReviewedAt(),r.getSanctionId());}
}
