package com.workgo.order.service.meet;
import com.fasterxml.jackson.databind.JsonNode;
import com.workgo.order.exception.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;
import java.util.*;

@Component
public class GoogleMeetClient implements MeetClient {
    private final MeetOAuthService oauth;
    private final RestClient http;
    public GoogleMeetClient(MeetOAuthService oauth){
        this.oauth=oauth;var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(2000);factory.setReadTimeout(5000);
        http=RestClient.builder().baseUrl("https://meet.googleapis.com/v2").requestFactory(factory).build();
    }
    @Override public void assertAuthorized(UUID host){oauth.assertAuthorized(host);}
    @Override public Space createSpace(UUID previewId,UUID host){
        String bearer;
        try{bearer=oauth.accessToken(host);}catch(RuntimeException e){throw new NotCreatedException();}
        try{return parse(http.post().uri("/spaces").headers(h->h.setBearerAuth(bearer))
                .body(Map.of("config",Map.of("accessType","RESTRICTED"))).retrieve().body(JsonNode.class));
        }catch(HttpClientErrorException e){
            int status=e.getStatusCode().value();if(status==400||status==401||status==403)throw new NotCreatedException();throw e;
        }
    }
    @Override public Space lookupSpace(UUID host,String name){
        if(name==null||!name.matches("spaces/[A-Za-z0-9_-]{3,128}"))throw new AppException(ErrorCode.PREVIEW_INVALID);
        return parse(http.get().uri("/"+name).headers(h->h.setBearerAuth(oauth.accessToken(host))).retrieve().body(JsonNode.class));
    }
    private Space parse(JsonNode json){
        String name=json==null?"":json.path("name").asText();String uri=json==null?"":json.path("meetingUri").asText();
        if(!name.matches("spaces/[A-Za-z0-9_-]{3,128}")||!uri.matches("https://meet\\.google\\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}"))
            throw new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE);
        return new Space(name,uri);
    }
}
