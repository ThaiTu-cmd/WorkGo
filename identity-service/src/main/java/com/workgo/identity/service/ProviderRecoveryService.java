package com.workgo.identity.service;
import com.workgo.identity.entity.*;import com.workgo.identity.repository.*;import com.workgo.identity.Exception.*;
import com.workgo.identity.service.admin.*;import com.workgo.identity.enumeration.AdminActionType;
import com.fasterxml.jackson.databind.*;import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.beans.factory.annotation.Value;
import java.net.*;import java.net.http.*;import java.time.*;import java.util.*;
@Service @RequiredArgsConstructor
public class ProviderRecoveryService {
    private final ProviderRecoveryGrantRepository grants;private final ProviderReputationSnapshotRepository reputation;
    private final InternalProviderProfileRepository profiles;private final ProviderSanctionRepository sanctions;
    private final ProviderSanctionService policy;private final AdminAuditService audit;private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();
    @Value("${app.services.payment:http://localhost:8084/payment}") private String payment;
    @Value("${app.services.order:http://localhost:8083/order}") private String order;
    @Value("${app.services.trust:http://localhost:8087/trust}") private String trust;
    @Value("${app.internal-api-key:}") private String key;
    @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ProviderRecoveryGrant approve(UUID id,String reason){
        if(reason==null||reason.isBlank()||reason.length()>1000)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        policy.requireSuperActor();
        var p=profiles.findById(id).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        if(p.userId().equals(policy.actor()))throw new org.springframework.security.access.AccessDeniedException("Independent recovery reviewer required");profiles.lockFinancialRestriction(p.userId()).orElseThrow();
        var score=reputation.lockByProviderId(id).orElseThrow(()->new AppException(ErrorCode.INVALID_STATE_TRANSITION));
        if(score.getScore()<5||score.getScore()>19||score.getLowScoreSince()==null||Instant.now().isBefore(score.getLowScoreSince().plus(Duration.ofDays(7)))
                ||sanctions.active(p.userId(),Set.of("PROVIDER","ACCOUNT","SECURITY"),Instant.now())>0||!"ACTIVE".equals(p.userStatus())||p.verificationStatus()!=com.workgo.identity.enumeration.VerificationStatus.VERIFIED)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        var balance=get(payment+"/internal/providers/"+id+"/financial-eligibility");
        var stats=get(order+"/internal/providers/"+id+"/admission-stats");
        if(!p.userId().toString().equals(balance.path("userId").asText())||!balance.path("mayStartNewWork").asBoolean()
                ||balance.path("outstandingFee").asLong(-1)!=0||!id.toString().equals(stats.path("providerId").asText())||stats.path("activeOrders").asLong(-1)!=0
                ||!stats.path("consumedRecoveryGrants").isArray())throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        var old=grants.findTopByProviderIdOrderByApprovedAtDesc(id).orElse(null);
        if(old!=null && old.getReputationVersion()==score.getSourceVersion() && old.getExpiresAt().isAfter(Instant.now())) {
            boolean consumed=false;
            for(var used:stats.path("consumedRecoveryGrants"))if(old.getId().toString().equals(used.asText()))consumed=true;
            if(!consumed)return old;
        }
        var g=new ProviderRecoveryGrant();g.setProviderId(id);g.setActorId(policy.actor());g.setReason(reason.trim());g.setApprovedAt(Instant.now());g.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));g.setReputationVersion(score.getSourceVersion());g=grants.saveAndFlush(g);
        audit.record(AdminAction.builder().action(AdminActionType.PROVIDER_SANCTION_UPDATED).targetType("RECOVERY_GRANT").targetId(g.getId()).reason(reason).afterState(Map.of("providerId",id,"oneSupervisedOrder",true)).build());return g;
    }
    @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')")
    public JsonNode complete(UUID id,String reason){
        if(reason==null||reason.isBlank()||reason.length()>900)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        policy.requireSuperActor();
        var p=profiles.findById(id).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        if(p.userId().equals(policy.actor()))throw new org.springframework.security.access.AccessDeniedException("Independent recovery reviewer required");
        profiles.lockFinancialRestriction(p.userId()).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        if(!"ACTIVE".equals(p.userStatus())||p.verificationStatus()!=com.workgo.identity.enumeration.VerificationStatus.VERIFIED||sanctions.active(p.userId(),Set.of("PROVIDER","ACCOUNT","SECURITY"),Instant.now())>0)throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        try{var body=Map.of("providerId",id,"actorId",policy.actor(),"reason",reason);var req=HttpRequest.newBuilder(URI.create(trust+"/internal/providers/"+id+"/recovery")).timeout(Duration.ofSeconds(5)).header("X-Internal-Key",key).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();var response=http.send(req,HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200)throw new IllegalStateException();var result=json.readTree(response.body());
            var account=result.path("result");
            if(result.path("code").asInt(-1)!=1000||!id.toString().equals(account.path("providerId").asText())
                    ||!account.path("score").isIntegralNumber()||account.path("score").asInt(-1)<0||account.path("score").asInt(101)>100
                    ||!account.path("version").isIntegralNumber())throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
            audit.record(AdminAction.builder().action(AdminActionType.PROVIDER_SANCTION_UPDATED).targetType("PROVIDER_RECOVERY").targetId(id).reason(reason).afterState(Map.of("status","REVIEWED")).build());return result;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);}catch(Exception e){throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);}
    }
    private JsonNode get(String url){try{var response=http.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(5)).header("X-Internal-Key",key).GET().build(),HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200)throw new IllegalStateException();return json.readTree(response.body());}catch(InterruptedException e){Thread.currentThread().interrupt();throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);}catch(Exception e){throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);}}
}
