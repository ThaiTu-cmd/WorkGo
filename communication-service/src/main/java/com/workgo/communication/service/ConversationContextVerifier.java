package com.workgo.communication.service;
import com.workgo.communication.enumeration.ContextType;
import com.workgo.communication.exception.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessResourceFailureException;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
@Service
public class ConversationContextVerifier {
    private final Map<ContextType,String> owners;
    private final String key;
    private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();
    public ConversationContextVerifier(ObjectMapper json,@Value("${app.internal-api-key:}") String key,
            @Value("${app.services.order}") String order,@Value("${app.services.job}") String job,
            @Value("${app.services.catalog}") String catalog,@Value("${app.services.trust:http://localhost:8087/trust}") String trust){
        this.json=json;this.key=key;owners=Map.of(ContextType.ORDER,order,ContextType.POST,job,ContextType.JOB,job,ContextType.SERVICE,catalog,ContextType.DISPUTE,trust);
    }
    public record Request(UUID requesterUserId,List<UUID> participantUserIds) {}
    public record VerifiedContext(String canonicalType,UUID canonicalId,List<UUID> allowedUsers,long contextVersion,String lifecycle) {}
    public VerifiedContext verify(ContextType type,UUID id,List<UUID> participants,UUID requester){
        ContextType canonical=type==ContextType.JOB?ContextType.POST:type;
        if(canonical==ContextType.GENERAL)return new VerifiedContext("GENERAL",null,participants,0,"ACTIVE");
        if(id==null||participants==null||participants.size()!=2||new HashSet<>(participants).size()!=2||!participants.contains(requester))throw new AppException(ErrorCode.INVALID_CONVERSATION_CONTEXT);
        try{
            if(key.isBlank())throw new IllegalStateException();
            var req=HttpRequest.newBuilder(URI.create(owners.get(canonical)+"/internal/chat-context/"+canonical+"/"+id+"/verify"))
                    .timeout(Duration.ofSeconds(5)).header("Content-Type","application/json").header("X-Internal-Key",key)
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(new Request(requester,participants)))).build();
            var response=http.send(req,HttpResponse.BodyHandlers.ofString());
            if(Set.of(400,403,404).contains(response.statusCode()))throw new AppException(ErrorCode.INVALID_CONVERSATION_CONTEXT);
            if(response.statusCode()!=200)throw new IllegalStateException();
            var ack=json.readValue(response.body(),VerifiedContext.class);
            if(!canonical.name().equals(ack.canonicalType())||!id.equals(ack.canonicalId())||ack.contextVersion()<0
                    ||ack.allowedUsers()==null||!ack.allowedUsers().containsAll(participants)||ack.lifecycle()==null)throw new IllegalStateException();
            return ack;
        }catch(AppException e){throw e;}catch(InterruptedException e){Thread.currentThread().interrupt();throw new DataAccessResourceFailureException("Context owner unavailable",e);}
        catch(Exception e){throw new DataAccessResourceFailureException("Context owner unavailable",e);}
    }
}
