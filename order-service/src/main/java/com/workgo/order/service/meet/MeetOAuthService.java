package com.workgo.order.service.meet;

import com.fasterxml.jackson.databind.JsonNode;
import com.workgo.order.entity.MeetAuthorization;
import com.workgo.order.exception.*;
import com.workgo.order.reppository.MeetAuthorizationRepository;
import com.workgo.order.utils.TokenUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import java.time.*;
import java.util.*;

@Service
public class MeetOAuthService {
    public static final String SCOPE="https://www.googleapis.com/auth/meetings.space.created";
    private final MeetAuthorizationRepository grants;
    private final TokenUtils token;
    private final Clock clock;
    private final TransactionTemplate tx;
    private final String clientId,clientSecret,redirectUri;
    private final TextEncryptor encryptor;
    private final RestClient http;
    public MeetOAuthService(MeetAuthorizationRepository grants,TokenUtils token,Clock clock,TransactionTemplate tx,
            @Value("${order.meet.client-id:}") String clientId,@Value("${order.meet.client-secret:}") String clientSecret,
            @Value("${order.meet.redirect-uri:}") String redirectUri,@Value("${order.meet.token-key:}") String key,
            @Value("${order.meet.token-salt:}") String salt) {
        this.grants=grants;this.token=token;this.clock=clock;this.tx=tx;
        this.clientId=clientId;this.clientSecret=clientSecret;this.redirectUri=redirectUri;
        this.encryptor=key.isBlank()||salt.isBlank()?null:Encryptors.delux(key,salt);
        var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(2000);factory.setReadTimeout(5000);
        http=RestClient.builder().requestFactory(factory).build();
    }
    private void configured(){
        if(clientId.isBlank()||clientSecret.isBlank()||redirectUri.isBlank()||encryptor==null)unavailable();
    }
    private static void unavailable(){throw new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE);}
    public Map<String,String> start(){
        configured();UUID user=token.getCurrentUserId();String state=UUID.randomUUID().toString()+UUID.randomUUID();
        tx.executeWithoutResult(s->{
            var a=grants.lockById(user).orElseGet(()->{var n=new MeetAuthorization();n.setUserId(user);return n;});
            a.setState(state);a.setStateExpiresAt(clock.instant().plusSeconds(600));grants.saveAndFlush(a);
        });
        return Map.of("authorizationUrl",UriComponentsBuilder.fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id",clientId).queryParam("redirect_uri",redirectUri).queryParam("response_type","code")
                .queryParam("scope",SCOPE).queryParam("access_type","offline").queryParam("prompt","consent")
                .queryParam("state",state).build().encode().toUriString());
    }
    /** Frontend callback forwards code/state with the same WorkGo JWT that started consent. */
    public void finish(String state,String code){
        configured();UUID user=token.getCurrentUserId();
        if(state==null||code==null||code.isBlank()||code.length()>4096)throw new AppException(ErrorCode.PREVIEW_INVALID);
        tx.executeWithoutResult(s->{
            var a=grants.lockById(user).orElseThrow(()->new AppException(ErrorCode.PREVIEW_CONFLICT));
            if(!state.equals(a.getState())||a.getStateExpiresAt()==null||!clock.instant().isBefore(a.getStateExpiresAt()))
                throw new AppException(ErrorCode.PREVIEW_CONFLICT);
            a.setState(null);a.setStateExpiresAt(null);grants.saveAndFlush(a);
        });
        var form=new LinkedMultiValueMap<String,String>();form.add("code",code);form.add("redirect_uri",redirectUri);form.add("grant_type","authorization_code");
        JsonNode result=exchange(form);
        String scopes=result.path("scope").asText();
        if(!Arrays.asList(scopes.split(" ")).contains(SCOPE)||!result.hasNonNull("refresh_token"))unavailable();
        String encrypted=encryptor.encrypt(result.path("refresh_token").asText());
        tx.executeWithoutResult(s->{var a=grants.lockById(user).orElseThrow();a.setEncryptedRefreshToken(encrypted);a.setScope(SCOPE);grants.saveAndFlush(a);});
    }
    public void assertAuthorized(UUID host){
        configured();var a=grants.findById(host).orElseThrow(()->new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE));
        if(!SCOPE.equals(a.getScope())||a.getEncryptedRefreshToken()==null)unavailable();
    }
    public String accessToken(UUID host){
        assertAuthorized(host);
        try {
            var form=new LinkedMultiValueMap<String,String>();
            form.add("refresh_token",encryptor.decrypt(grants.findById(host).orElseThrow().getEncryptedRefreshToken()));form.add("grant_type","refresh_token");
            JsonNode result=exchange(form);
            if(!result.hasNonNull("access_token")||(result.has("scope")&&!Arrays.asList(result.path("scope").asText().split(" ")).contains(SCOPE)))unavailable();
            return result.path("access_token").asText();
        }catch(AppException e){throw e;}catch(RuntimeException e){throw new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE);}
    }
    private JsonNode exchange(LinkedMultiValueMap<String,String> form){
        form.add("client_id",clientId);form.add("client_secret",clientSecret);
        try{var result=http.post().uri("https://oauth2.googleapis.com/token").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form).retrieve().body(JsonNode.class);
            if(result==null)unavailable();return result;
        }catch(RuntimeException e){throw new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE);}
    }
    public void disconnect(){tx.executeWithoutResult(s->grants.deleteById(token.getCurrentUserId()));}
}
