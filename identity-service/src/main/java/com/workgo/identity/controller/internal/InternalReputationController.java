package com.workgo.identity.controller.internal;
import com.workgo.identity.entity.ProviderReputationSnapshot;
import com.workgo.identity.repository.*;
import com.workgo.identity.Exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/providers")
public class InternalReputationController {
    private final ProviderReputationSnapshotRepository rows;private final InternalProviderProfileRepository profiles;
    public record Change(UUID providerId,int score,long sourceVersion,String policyVersion) {}
    @PutMapping("/{id}/reputation") @Transactional
    public ProviderReputationSnapshot apply(@PathVariable UUID id,@RequestBody Change req){
        if(req==null||!id.equals(req.providerId())||req.score()<0||req.score()>100||req.sourceVersion()<1||!"WG-POLICY-1.0".equals(req.policyVersion()))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        var p=profiles.findById(id).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));profiles.lockFinancialRestriction(p.userId()).orElseThrow();
        var r=rows.findById(id).orElseGet(()->new ProviderReputationSnapshot(id));
        if(req.sourceVersion()==r.getSourceVersion()&&req.score()!=r.getScore())throw new AppException(ErrorCode.RATING_SNAPSHOT_CONFLICT);
        if(req.sourceVersion()>r.getSourceVersion()){
            if(req.score()<20&&r.getLowScoreSince()==null)r.setLowScoreSince(Instant.now());if(req.score()>=20)r.setLowScoreSince(null);
            r.setScore(req.score());r.setSourceVersion(req.sourceVersion());r.setPolicyVersion(req.policyVersion());rows.saveAndFlush(r);
        }
        return r;
    }
}
