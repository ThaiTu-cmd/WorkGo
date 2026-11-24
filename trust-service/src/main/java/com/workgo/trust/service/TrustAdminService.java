package com.workgo.trust.service;

import com.workgo.trust.entity.*;
import com.workgo.trust.enumeration.*;
import com.workgo.trust.exception.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.repository.client.IdentityClient;
import com.workgo.trust.dto.request.client.*;
import com.workgo.trust.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class TrustAdminService {
    private final ReviewRepository reviews;
    private final ReportRepository reports;
    private final DisputeRepository disputes;
    private final TrustAdminAuditRepository audit;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;
    private final IdentityClient identity;
    private final TokenUtils token;

    public Review moderate(UUID id, ModerationStatus target, String reason, long version) {
        admin(reason);
        if (target==null || target==ModerationStatus.PENDING) throw new AppException(ErrorCode.INVALID_REQUEST);
        var sample=reviews.findById(id).orElseThrow(()->new AppException(ErrorCode.REVIEW_NOT_FOUND));
        UUID provider=sample.getDirection()==ReviewDirection.CLIENT_TO_PROVIDER?sample.getRevieweeId():sample.getReviewerId();
        return transactions.locked(ReviewService.keys(sample.getOrderId(),provider,sample.getServiceId()),()->{
            var review=reviews.findById(id).orElseThrow(()->new AppException(ErrorCode.REVIEW_NOT_FOUND));
            version(review.getVersion(),version);
            if(review.getModerationStatus()==ModerationStatus.REJECTED)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            if (review.getModerationStatus()==target) throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            log(id,"REVIEW_MODERATION",reason,review.getModerationStatus().name(),target.name());
            review.setModerationStatus(target); reviews.flush();
            if (review.isPublished() && review.getDirection()==ReviewDirection.CLIENT_TO_PROVIDER) {
                var stats=reviews.calculateRevieweeRatingStats(provider,ReviewDirection.CLIENT_TO_PROVIDER);
                outbox.add("PROVIDER",provider,"review.published.provider",new ProviderRatingStatsRequest(ReviewService.avg(stats),ReviewService.count(stats),transactions.nextVersion("rating:provider:"+provider)));
                if(review.getServiceId()!=null) {
                    var serviceStats=reviews.calculateServiceRatingStats(review.getServiceId());
                    outbox.add("SERVICE",review.getServiceId(),"review.published.service",new ServiceRatingStatsRequest(ReviewService.avg(serviceStats),ReviewService.count(serviceStats),transactions.nextVersion("rating:service:"+review.getServiceId())));
                }
            }
            return review;
        });
    }
    public Report report(UUID id,ReportStatus target,String reason,long version) {
        admin(reason);
        if(target==null || target==ReportStatus.PENDING) throw new AppException(ErrorCode.INVALID_REQUEST);
        return transactions.locked(List.of("report:"+id),()->{
            var r=reports.findById(id).orElseThrow(()->new AppException(ErrorCode.REPORT_NOT_FOUND));version(r.getVersion(),version);
            if(r.getStatus()==ReportStatus.RESOLVED||r.getStatus()==ReportStatus.REJECTED||r.getStatus()==target)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            log(id,"REPORT_RESOLUTION",reason,r.getStatus().name(),target.name());r.setStatus(target);
            if(r.getHandledBy()==null)r.setHandledBy(token.getCurrentUserId());
            if(target==ReportStatus.RESOLVED||target==ReportStatus.REJECTED){r.setResolvedAt(Instant.now());r.setResolvedBy(token.getCurrentUserId());r.setResolutionNote(reason.strip());}reports.flush();return r;
        });
    }
    public Dispute take(UUID id,String reason,long version) {
        admin(reason); var sample=disputes.findById(id).orElseThrow(DisputeNotFoundException::new);
        independent(sample);
        return transactions.locked(List.of("order:"+sample.getOrderId()),()->{
            var d=disputes.findById(id).orElseThrow(DisputeNotFoundException::new);version(d.getVersion(),version);
            if(d.getStatus()!=DisputeStatus.OPEN||d.getAssignedAdminId()!=null)throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            log(id,"DISPUTE_TAKE_OVER",reason,"OPEN","UNDER_REVIEW");d.setAssignedAdminId(token.getCurrentUserId());d.setClaimedAt(Instant.now());d.setStatus(DisputeStatus.UNDER_REVIEW);
            disputes.flush();return d;
        });
    }
    public Dispute requestEvidence(UUID id,String reason,long version) {
        admin(reason);var sample=disputes.findById(id).orElseThrow(DisputeNotFoundException::new);independent(sample);
        return transactions.locked(List.of("order:"+sample.getOrderId()),()->{
            var d=disputes.findById(id).orElseThrow(DisputeNotFoundException::new);version(d.getVersion(),version);assigned(d);
            if(d.getEvidenceRequest()!=null||d.getDecisionId()!=null)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            d.setEvidenceRequest(reason.strip());
            // Deadline starts only after both durable notifications are acknowledged; worker sets it.
            outbox.notify(d.getClientId(),null,"DISPUTE_EVIDENCE_REQUESTED","DISPUTE",id);
            outbox.notify(null,d.getProviderId(),"DISPUTE_EVIDENCE_REQUESTED","DISPUTE",id);
            log(id,"DISPUTE_EVIDENCE_REQUEST",reason,"NONE","NOTIFICATION_PENDING");
            disputes.flush();return d;
        });
    }
    public void independent(Dispute d) {
        UUID user=token.getCurrentUserId();
        if(user.equals(d.getClientId())||user.equals(d.getOpenedBy())||d.getProviderId().equals(token.getCurrentProviderIdOrNull()))throw new AccessDeniedException("Case participant");
        com.workgo.trust.dto.response.client.InternalProviderProfileResponse profile;
        try {profile=identity.getProviderProfile(d.getProviderId());}catch(RuntimeException e){throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        if(profile==null||!d.getProviderId().equals(profile.providerProfileId())||profile.userId()==null)throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        if(user.equals(profile.userId()))throw new AccessDeniedException("Case participant");
    }
    public void assigned(Dispute d) {
        if(d.getStatus()!=DisputeStatus.UNDER_REVIEW||!token.getCurrentUserId().equals(d.getAssignedAdminId()))throw new AccessDeniedException("Assigned administrator required");
    }
    private void admin(String reason) {
        if(!token.hasRole("ROLE_ADMIN"))throw new AccessDeniedException("Administrator required");
        if(reason==null||reason.isBlank()||reason.length()>1000)throw new AppException(ErrorCode.INVALID_REQUEST);
    }
    private void version(Long actual,long expected){if(!Objects.equals(actual,expected))throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);}
    private void log(UUID id,String action,String reason,String before,String after){audit.save(new TrustAdminAudit(token.getCurrentUserId(),id,action,reason.strip(),before,after));}
}
