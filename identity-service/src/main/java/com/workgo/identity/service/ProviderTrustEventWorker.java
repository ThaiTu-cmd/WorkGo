package com.workgo.identity.service;
import com.workgo.identity.repository.ProviderTrustEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Value;
import java.net.*;
import java.net.http.*;
import java.time.*;
import java.util.*;
@Component @RequiredArgsConstructor
public class ProviderTrustEventWorker {
    private final ProviderTrustEventRepository events;
    private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).followRedirects(HttpClient.Redirect.NEVER).build();
    @Value("${app.services.trust:http://localhost:8087/trust}") private String trust;
    @Value("${app.internal-api-key:}") private String key;
    @Scheduled(fixedDelayString="${app.provider-trust-poll-ms:30000}",initialDelay=30000)
    public void deliver(){if(key.isBlank())return;for(var e:events.findTop50ByDeliveredAtIsNullOrderByApprovedAtAsc()){
        try {
            var body=json.writeValueAsString(Map.of("eventId","provider-approved:"+e.getProviderId(),"userId",e.getUserId(),"approvedAt",e.getApprovedAt()));
            var req=HttpRequest.newBuilder(URI.create(trust+"/internal/providers/"+e.getProviderId()+"/approved")).timeout(Duration.ofSeconds(5))
                    .header("X-Internal-Key",key).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
            var response=http.send(req,HttpResponse.BodyHandlers.ofString());var ack=json.readTree(response.body());
            if(response.statusCode()!=200||ack.path("code").asInt()!=1000||!e.getProviderId().toString().equals(ack.path("result").path("providerId").asText()))throw new IllegalStateException("INVALID_TRUST_ACK");
            e.setDeliveredAt(Instant.now());e.setLastError(null);
        }catch(InterruptedException interrupted){Thread.currentThread().interrupt();return;}
        catch(Exception ex){e.setLastError(ex.getClass().getSimpleName());}
        try{events.save(e);}catch(org.springframework.orm.ObjectOptimisticLockingFailureException raced){/* stable event replay is safe */}
    }}
}
