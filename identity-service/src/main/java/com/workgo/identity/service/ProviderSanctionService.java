package com.workgo.identity.service;
import com.workgo.identity.entity.*;
import com.workgo.identity.repository.*;
import com.workgo.identity.Exception.*;
import com.workgo.identity.service.admin.*;
import com.workgo.identity.enumeration.AdminActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import java.time.*;
import java.util.*;
@Service @RequiredArgsConstructor
public class ProviderSanctionService {
    private final ProviderSanctionRepository sanctions;
    private final SanctionAppealRepository appeals;
    private final InternalProviderProfileRepository profiles;
    private final AdminAuditService audit;
    private final UserRepository users;
    private final RoleRepository roles;
    private final ProviderReputationSnapshotRepository reputation;
    private final ProviderRecoveryGrantRepository recoveries;
    private final SanctionProjectionService projections;
    public record Create(String scope,String reason,String reference,Instant effectiveAt,Instant expiresAt) {}
    public record Admission(UUID providerId,boolean mayReceiveNewOrders,boolean payoutAllowed,long sourceVersion,UUID recoveryGrantId) {}
    public UUID actor(){var auth=SecurityContextHolder.getContext().getAuthentication();if(auth==null||!(auth.getPrincipal() instanceof Jwt jwt)||jwt.getClaimAsString("userId")==null)throw new AppException(ErrorCode.UNAUTHENTICATED);return UUID.fromString(jwt.getClaimAsString("userId"));}
    @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ProviderSanction create(UUID provider,Create req) {
        if(req==null||req.scope()==null||!Set.of("PROVIDER","ACCOUNT","SECURITY").contains(req.scope())||blank(req.reason())||req.reason().length()>1000
                ||blank(req.reference())||req.reference().length()>200||req.effectiveAt()==null
                ||req.expiresAt()!=null&&!req.expiresAt().isAfter(req.effectiveAt()))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        requireSuperActor();
        var p=profiles.findById(provider).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        if(actor().equals(p.userId()))throw new AppException(ErrorCode.SELF_ACCOUNT_CHANGE_NOT_ALLOWED);
        profiles.lockFinancialRestriction(p.userId()).orElseThrow();
        var s=new ProviderSanction();s.setProviderId(provider);s.setUserId(p.userId());s.setActorId(actor());s.setScope(req.scope());
        s.setReason(req.reason().strip());s.setReference(req.reference().strip());s.setEffectiveAt(req.effectiveAt());s.setExpiresAt(req.expiresAt());
        s=sanctions.saveAndFlush(s);projections.refresh(provider);log(s,"SANCTION_CREATED",req.reason());return s;
    }
    @Transactional
    public SanctionAppeal appeal(UUID id,String explanation) {
        if(blank(explanation)||explanation.length()>2000)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        var s=sanctions.lock(id).orElseThrow(()->new AppException(ErrorCode.INVALID_STATE_TRANSITION));
        if(!s.getUserId().equals(actor()))throw new org.springframework.security.access.AccessDeniedException("Sanction owner required");
        var old=appeals.findBySanctionIdAndUserId(id,actor()).orElse(null);
        if(old!=null){if(!old.getExplanation().equals(explanation.strip()))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);return old;}
        if(Instant.now().isAfter(s.getEffectiveAt().plus(Duration.ofDays(7))))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        var a=new SanctionAppeal();a.setSanctionId(id);a.setUserId(actor());a.setExplanation(explanation.strip());a.setSubmittedAt(Instant.now());
        return appeals.saveAndFlush(a);
    }
    @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')")
    public SanctionAppeal review(UUID id,boolean accepted,String reason,Long version) {
        if(blank(reason)||reason.length()>1000)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        requireSuperActor();
        var a=appeals.lock(id).orElseThrow(()->new AppException(ErrorCode.INVALID_STATE_TRANSITION));
        if(!Objects.equals(version,a.getVersion())||!"PENDING".equals(a.getStatus()))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        var s=sanctions.lock(a.getSanctionId()).orElseThrow();
        if(actor().equals(s.getUserId())||actor().equals(s.getActorId()))throw new org.springframework.security.access.AccessDeniedException("Independent reviewer required");
        a.setStatus(accepted?"ACCEPTED":"REJECTED");a.setReviewedBy(actor());a.setReviewedAt(Instant.now());a.setDecisionReason(reason.strip());
        if(accepted){s.setRevokedAt(Instant.now());s.setRevokedBy(actor());s.setRevocationReason(reason.strip());sanctions.save(s);}
        projections.refresh(s.getProviderId());log(s,accepted?"SANCTION_REVOKED":"APPEAL_REJECTED",reason);return appeals.save(a);
    }
    @Transactional(readOnly=true)
    public Admission admission(UUID provider) {
        var p=profiles.findById(provider).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        boolean active="ACTIVE".equals(p.userStatus());
        boolean blocked=sanctions.active(p.userId(),Set.of("PROVIDER","ACCOUNT","SECURITY"),Instant.now())>0;
        var score=reputation.findById(provider).orElse(null);
        var recovery=recoveries.findTopByProviderIdOrderByApprovedAtDesc(provider).orElse(null);
        UUID grant=score!=null&&score.getScore()>=5&&score.getScore()<20&&recovery!=null&&recovery.getExpiresAt().isAfter(Instant.now())&&recovery.getReputationVersion()==score.getSourceVersion()?recovery.getId():null;
        if(score==null||score.getScore()<20&&grant==null)blocked=true;
        boolean payout=sanctions.active(p.userId(),Set.of("ACCOUNT","SECURITY"),Instant.now())==0;
        return new Admission(provider,active&&!blocked&&p.acceptingOrders()&&p.verificationStatus()==com.workgo.identity.enumeration.VerificationStatus.VERIFIED,active&&payout,sanctions.revision(provider)+(score==null?0:score.getSourceVersion()),grant);
    }
    public boolean payoutAllowed(UUID user){return users.findById(user).isPresent() && sanctions.active(user,Set.of("ACCOUNT","SECURITY"),Instant.now())==0;}
    public List<ProviderSanction> list(UUID provider){
        var p=profiles.findById(provider).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        boolean admin=SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if(!admin&&!p.userId().equals(actor()))throw new org.springframework.security.access.AccessDeniedException("Sanction owner required");
        return sanctions.findByProviderIdOrderByEffectiveAtDesc(provider);
    }
    void requireSuperActor(){
        roles.lockByName(com.workgo.identity.enumeration.RoleName.SUPER_ADMIN).orElseThrow(()->new AppException(ErrorCode.ROLE_NOT_EXISTED));
        var actor=users.lockActiveById(actor()).orElseThrow(()->new AppException(ErrorCode.UNAUTHORIZED));
        if(actor.getStatus()!=com.workgo.identity.enumeration.UserStatus.ACTIVE
                ||actor.getUserRoles().stream().noneMatch(r->r.getRole().getRoleName()==com.workgo.identity.enumeration.RoleName.SUPER_ADMIN)
                ||sanctions.active(actor.getUserId(),Set.of("ACCOUNT","SECURITY"),Instant.now())>0)throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    private void log(ProviderSanction s,String action,String reason){audit.record(AdminAction.builder().action(AdminActionType.PROVIDER_SANCTION_UPDATED).targetType("PROVIDER_SANCTION").targetId(s.getId()).reason(reason).afterState(Map.of("action",action,"scope",s.getScope(),"providerId",s.getProviderId())).build());}
    private boolean blank(String v){return v==null||v.isBlank();}
}
