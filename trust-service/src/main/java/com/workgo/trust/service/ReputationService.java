package com.workgo.trust.service;

import com.workgo.trust.entity.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.repository.client.IdentityClient;
import com.workgo.trust.exception.*;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.*;

@Service @RequiredArgsConstructor
public class ReputationService {
    private final ReputationAccountRepository accounts;
    private final ReputationLedgerRepository ledger;
    private final DisputeDecisionRepository decisions;
    private final TrustTransactions transactions;
    private final TrustOrderAccess orders;
    private final IdentityClient identity;
    private final ReputationProjectionService projections;
    public boolean superseded(UUID decision){return decision!=null&&decisions.existsBySupersedesDecisionId(decision);}
    public ReputationAccount recover(UUID provider,Set<String> grants,UUID actor,String reason){
        String source="recovery:"+hash(String.join("|",grants));String payload=hash(provider+"|"+actor+"|"+source+"|"+reason);
        return transactions.locked(List.of("reputation:"+provider),()->{
            var a=accounts.findById(provider).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
            var old=ledger.findByProviderIdAndSourceKey(provider,source).orElse(null);
            if(old!=null){if(!payload.equals(old.getPayloadHash()))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);return a;}
            if(a.getScore()<5||a.getScore()>=20)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            int delta=20-a.getScore();append(a,null,null,source,"RECOVERY",delta,delta,"Recovery approved by "+actor+": "+reason,payload,null);accounts.flush();return a;
        });
    }
    public ReputationAccount approved(UUID provider,UUID user) {
        var p=identity.getProviderProfile(provider);
        if(p==null||!provider.equals(p.providerProfileId())||!user.equals(p.userId())||!"VERIFIED".equals(p.verificationStatus()))throw new AppException(ErrorCode.INVALID_REQUEST);
        return transactions.locked(List.of("reputation:"+provider),()->{var a=initialize(provider);projections.ensure(provider,a.getScore());return a;});
    }
    public record Penalty(@NotBlank @Size(max=100) String eventId,@NotNull UUID orderId,@NotNull UUID providerId,
            UUID decisionId,@NotBlank String type,@Min(0) @Max(6) int cycles,@NotBlank @Size(max=1000) String reason) {}
    public ReputationAccount penalize(Penalty req) {
        var order=orders.snapshot(req.orderId());
        if(!req.providerId().equals(order.providerId())||!Set.of("LATE","ABANDONMENT","CAPABILITY").contains(req.type())
                ||req.type().equals("LATE")&&(!"DIGITAL".equals(order.executionType())||req.cycles()<1))throw new AppException(ErrorCode.INVALID_REQUEST);
        var d=req.decisionId()==null?null:decisions.findById(req.decisionId()).orElse(null);
        if(d==null||!req.orderId().equals(d.getOrderId())||d.getEffectiveAt()==null||d.getEffectiveAt().isAfter(java.time.Instant.now())
                ||!req.type().equals(d.getFaultType())||req.type().equals("LATE")&&req.cycles()!=d.getLateCycles()
                ||decisions.existsBySupersedesDecisionId(d.getDecisionId()))throw new AppException(ErrorCode.INVALID_REQUEST);
        verified(req.providerId());
        String hash=hash(req.orderId()+"|"+req.providerId()+"|"+req.decisionId()+"|"+req.type()+"|"+req.cycles()+"|"+req.reason());
        return transactions.locked(List.of("order:"+req.orderId(),"reputation:"+req.providerId()),()->{
            var account=accounts.findById(req.providerId()).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));String key="event:"+req.eventId();
            if(decisions.existsBySupersedesDecisionId(req.decisionId()))throw new AppException(ErrorCode.INVALID_REQUEST);
            var old=ledger.findByProviderIdAndSourceKey(req.providerId(),key).orElse(null);
            if(old!=null){if(!old.getPayloadHash().equals(hash))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);return account;}
            long current=Math.max(0,-ledger.penalties(req.providerId(),req.orderId()));
            int target=switch(req.type()){case "ABANDONMENT"->50;case "CAPABILITY"->10;default->req.cycles()*(req.cycles()+1)/2;};
            int delta=-(int)Math.max(0,target-current);
            append(account,req.orderId(),req.decisionId(),key,"PENALTY",delta,delta,req.reason(),hash,null);accounts.flush();return account;
        });
    }
    public ReputationAccount reverse(UUID entryId,UUID correctionDecision,String reason) {
        var entry=ledger.findById(entryId).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
        if(!"PENALTY".equals(entry.getKind())||correctionDecision==null||reason==null||reason.isBlank()||reason.length()>1000)throw new AppException(ErrorCode.INVALID_REQUEST);
        var decision=decisions.findById(correctionDecision).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
        if(!entry.getOrderId().equals(decision.getOrderId())||!"CORRECTION".equals(decision.getFaultType())
                ||!Objects.equals(entry.getDecisionId(),decision.getSupersedesDecisionId())||decision.getEffectiveAt()==null
                ||entry.getDecisionId().equals(correctionDecision))throw new AppException(ErrorCode.INVALID_REQUEST);
        return transactions.locked(List.of("reputation:"+entry.getProviderId()),()->{
            var account=accounts.findById(entry.getProviderId()).orElseThrow();String key="correction:"+entryId;
            if(ledger.findByProviderIdAndSourceKey(entry.getProviderId(),key).isPresent())throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);
            append(account,entry.getOrderId(),correctionDecision,key,"CORRECTION",-entry.getRequestedDelta(),-entry.getAppliedDelta(),reason,hash(entryId+"|"+correctionDecision+"|"+reason),entryId);
            accounts.flush();return account;
        });
    }
    public ReputationAccount reward(RewardSnapshot snapshot) {
        return reward(snapshot,snapshot.getPoints());
    }
    public ReputationAccount reward(RewardSnapshot snapshot,int approvedPoints) {
        if(approvedPoints<0||approvedPoints>snapshot.getPoints())throw new AppException(ErrorCode.INVALID_REQUEST);
        return transactions.locked(List.of("reputation:"+snapshot.getProviderId()),()->{
            var account=accounts.findById(snapshot.getProviderId()).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));String source="reward:"+snapshot.getOrderId();
            if(ledger.findByProviderIdAndSourceKey(snapshot.getProviderId(),source).isPresent())return account;
            java.time.Instant now=java.time.Instant.now();
            long pair=ledger.rewards(snapshot.getProviderId(),snapshot.getClientId(),now.minusSeconds(30L*86400));
            long total=ledger.rewards(snapshot.getProviderId(),null,now.minusSeconds(7L*86400));
            int granted=(int)Math.max(0,Math.min(approvedPoints,Math.min(5-pair,10-total)));
            int before=account.getScore(),after=Math.min(100,before+granted);
            var entry=new ReputationLedgerEntry(snapshot.getProviderId(),snapshot.getOrderId(),null,source,"REWARD",granted,before,after,"Confirmed completion; rolling limits applied",snapshot.getInputHash(),null);
            entry.assignRewardClient(snapshot.getClientId());ledger.save(entry);account.setScore(after);projections.record(account.getProviderId(),after);accounts.flush();return account;
        });
    }
    private ReputationAccount initialize(UUID provider){
        var account=accounts.findById(provider).orElse(null);if(account!=null)return account;
        account=accounts.save(new ReputationAccount(provider));append(account,null,null,"INITIAL","INITIAL",80,80,"Verified provider baseline",hash("INITIAL"),null);return account;
    }
    private void append(ReputationAccount a,UUID order,UUID decision,String source,String kind,int requested,int applied,String reason,String hash,UUID reference){
        int before=a.getScore(),after=Math.max(0,Math.min(100,before+applied));
        ledger.save(new ReputationLedgerEntry(a.getProviderId(),order,decision,source,kind,requested,before,after,reason,hash,reference));a.setScore(after);projections.record(a.getProviderId(),after);
    }
    private void verified(UUID id){
        com.workgo.trust.dto.response.client.InternalProviderProfileResponse p;
        try{p=identity.getProviderProfile(id);}catch(RuntimeException e){throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        if(p==null||!id.equals(p.providerProfileId())||!"VERIFIED".equals(p.verificationStatus()))throw new AppException(ErrorCode.INVALID_REQUEST);
    }
    static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
