package com.workgo.identity.service;
import com.workgo.identity.repository.*;import com.workgo.identity.entity.ProviderTrustEvent;
import com.workgo.identity.Exception.*;import com.workgo.identity.service.admin.*;import com.workgo.identity.enumeration.*;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import org.springframework.security.access.prepost.PreAuthorize;
import lombok.RequiredArgsConstructor;import java.util.*;import java.time.Instant;
@Service @RequiredArgsConstructor
public class ProviderReputationInitializationService {
 private final InternalProviderProfileRepository profiles;private final ProviderTrustEventRepository events;private final AdminAuditService audit;
 @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')") public ProviderTrustEvent initialize(UUID id,String reason){
  if(reason==null||reason.isBlank()||reason.length()>1000)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
  var p=profiles.findById(id).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));profiles.lockFinancialRestriction(p.userId()).orElseThrow();
  if(p.verificationStatus()!=VerificationStatus.VERIFIED||!"ACTIVE".equals(p.userStatus()))throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
  var old=events.findById(id).orElse(null);if(old!=null)return old;
  var event=new ProviderTrustEvent(id,p.userId());event=events.saveAndFlush(event);
  audit.record(AdminAction.builder().action(AdminActionType.PROVIDER_SANCTION_UPDATED).targetType("LEGACY_REPUTATION_INITIALIZATION").targetId(id).reason(reason).afterState(Map.of("policyVersion","WG-POLICY-1.0","historicalRewardsGranted",false,"sourceEvent","provider-approved:"+id)).build());return event;
 }
}
