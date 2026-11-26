package com.workgo.trust.service;
import com.workgo.trust.repository.ReputationProjectionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import lombok.RequiredArgsConstructor;
import java.net.*;import java.net.http.*;import java.time.Duration;import java.util.*;
@Component @RequiredArgsConstructor
public class ReputationProjectionWorker {
    private final ReputationProjectionRepository rows;private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();
    @Value("${app.services.identity}") private String identity;
    @Value("${app.services.job:http://localhost:8085/job}") private String job;
    @Value("${app.services.catalog:http://localhost:8082/catalog}") private String catalog;
    @Value("${app.services.order:http://localhost:8083/order}") private String order;
    @Value("${app.internal-api-key:}") private String key;
    @Value("${app.workers.enabled:true}") private boolean enabled;
    @Scheduled(fixedDelay=30000,initialDelay=30000)
    public void deliver(){if(!enabled||key.isBlank())return;for(var r:rows.pending()){
        String error=null;
        if(r.getIdentitySyncedVersion()<r.getSourceVersion())try{
            var ack=send(identity+"/internal/providers/"+r.getProviderId()+"/reputation",Map.of("providerId",r.getProviderId(),"score",r.getScore(),"sourceVersion",r.getSourceVersion(),"policyVersion","WG-POLICY-1.0"));
            if(!r.getProviderId().toString().equals(ack.path("providerId").asText())||ack.path("score").asInt(-1)!=r.getScore()||ack.path("sourceVersion").asLong(-1)!=r.getSourceVersion())throw new IllegalStateException();
            rows.identityAck(r.getProviderId(),r.getSourceVersion());
        }catch(Exception e){error="IDENTITY:"+e.getClass().getSimpleName();}
        if(r.getJobSyncedVersion()<r.getSourceVersion())try{
            var ack=send(job+"/internal/providers/"+r.getProviderId()+"/restrictions",Map.of("source","REPUTATION","sourceVersion",r.getSourceVersion(),"blocked",r.getScore()<20)).path("result");
            if(!r.getProviderId().toString().equals(ack.path("providerId").asText())||!"REPUTATION".equals(ack.path("source").asText())||ack.path("sourceVersion").asLong(-1)!=r.getSourceVersion()||ack.path("blocked").asBoolean()!= (r.getScore()<20))throw new IllegalStateException();
            rows.jobAck(r.getProviderId(),r.getSourceVersion());
        }catch(Exception e){error="JOB:"+e.getClass().getSimpleName();}
        for(String destination:List.of("CATALOG","ORDER")){
            long done=destination.equals("CATALOG")?r.getCatalogSyncedVersion():r.getOrderSyncedVersion();
            if(done>=r.getSourceVersion())continue;
            try{var ack=send((destination.equals("CATALOG")?catalog:order)+"/internal/providers/"+r.getProviderId()+"/restrictions",Map.of("source","REPUTATION","sourceVersion",r.getSourceVersion(),"blocked",r.getScore()<20));
                if(!r.getProviderId().toString().equals(ack.path("providerId").asText())||!"REPUTATION".equals(ack.path("source").asText())||ack.path("sourceVersion").asLong(-1)!=r.getSourceVersion()||!ack.path("blocked").isBoolean()||ack.path("blocked").asBoolean()!=(r.getScore()<20))throw new IllegalStateException();
                if(destination.equals("CATALOG"))rows.catalogAck(r.getProviderId(),r.getSourceVersion());else rows.orderAck(r.getProviderId(),r.getSourceVersion());
            }catch(Exception e){error=destination+":"+e.getClass().getSimpleName();}
        }
        rows.error(r.getProviderId(),r.getSourceVersion(),error);
    }}
    private com.fasterxml.jackson.databind.JsonNode send(String url,Object body)throws Exception{
        try{var req=HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(5)).header("Content-Type","application/json").header("X-Internal-Key",key).PUT(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();var response=http.send(req,HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200)throw new IllegalStateException();return json.readTree(response.body());}
        catch(InterruptedException e){Thread.currentThread().interrupt();throw e;}
    }
}
