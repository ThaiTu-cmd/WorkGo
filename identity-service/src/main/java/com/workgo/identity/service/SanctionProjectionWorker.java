package com.workgo.identity.service;
import com.workgo.identity.repository.SanctionProjectionRepository;import com.fasterxml.jackson.databind.ObjectMapper;import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Component;import org.springframework.scheduling.annotation.Scheduled;import org.springframework.beans.factory.annotation.Value;
import java.net.*;import java.net.http.*;import java.time.Duration;import java.util.*;
@Component @RequiredArgsConstructor
public class SanctionProjectionWorker {
 private final SanctionProjectionRepository rows;private final SanctionProjectionService state;private final ObjectMapper json;
 private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();
 @Value("${app.services.job:http://localhost:8085/job}")private String job;
 @Value("${app.services.catalog:http://localhost:8082/catalog}")private String catalog;
 @Value("${app.services.order:http://localhost:8083/order}")private String order;
 @Value("${app.internal-api-key:}")private String key;
 @Scheduled(fixedDelay=30000,initialDelay=30000)public void deliver(){if(key.isBlank())return;for(var old:rows.findAll()){
  try{state.refresh(old.getProviderId());}catch(RuntimeException unavailable){continue;}
  var r=rows.findById(old.getProviderId()).orElseThrow();String error=null;
  for(String target:List.of("JOB","CATALOG","ORDER")){
   long synced=target.equals("JOB")?r.getJobSyncedVersion():target.equals("CATALOG")?r.getCatalogSyncedVersion():r.getOrderSyncedVersion();if(synced>=r.getSourceVersion())continue;
   try{String base=target.equals("JOB")?job:target.equals("CATALOG")?catalog:order;
    var req=HttpRequest.newBuilder(URI.create(base+"/internal/providers/"+r.getProviderId()+"/restrictions")).timeout(Duration.ofSeconds(5)).header("X-Internal-Key",key).header("Content-Type","application/json").PUT(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of("source","SANCTION","sourceVersion",r.getSourceVersion(),"blocked",r.isBlocked())))).build();
    var response=http.send(req,HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200)throw new IllegalStateException();var ack=json.readTree(response.body());if(target.equals("JOB"))ack=ack.path("result");
    if(!r.getProviderId().toString().equals(ack.path("providerId").asText())||!"SANCTION".equals(ack.path("source").asText())||ack.path("sourceVersion").asLong(-1)!=r.getSourceVersion()||ack.path("blocked").asBoolean()!=r.isBlocked())throw new IllegalStateException();
    if(target.equals("JOB"))rows.jobAck(r.getProviderId(),r.getSourceVersion());else if(target.equals("CATALOG"))rows.catalogAck(r.getProviderId(),r.getSourceVersion());else rows.orderAck(r.getProviderId(),r.getSourceVersion());
   }catch(InterruptedException e){Thread.currentThread().interrupt();return;}catch(Exception e){error=target+":"+e.getClass().getSimpleName();}
  }rows.error(r.getProviderId(),r.getSourceVersion(),error);
 }}
}
