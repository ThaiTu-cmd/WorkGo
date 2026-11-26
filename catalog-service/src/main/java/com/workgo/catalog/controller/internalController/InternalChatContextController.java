package com.workgo.catalog.controller.internalController;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.repository.httpclient.ContextIdentityClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/chat-context")
public class InternalChatContextController {
    private final ServiceRepository services;private final ContextIdentityClient identity;
    public record Request(UUID requesterUserId,List<UUID> participantUserIds) {}
    public record VerifiedContext(String canonicalType,UUID canonicalId,List<UUID> allowedUsers,long contextVersion,String lifecycle) {}
    @PostMapping("/{type}/{id}/verify")
    public VerifiedContext verify(@PathVariable String type,@PathVariable UUID id,@RequestBody Request request){
        if(!"SERVICE".equals(type)||request==null||request.participantUserIds()==null||request.participantUserIds().size()!=2||!request.participantUserIds().contains(request.requesterUserId()))throw new org.springframework.security.access.AccessDeniedException("Service participants required");
        var s=services.findById(id).orElseThrow();
        if(!Set.of("PUBLISHED","PAUSED").contains(s.getStatus().name()))throw new org.springframework.security.access.AccessDeniedException("Service is unavailable");
        var p=identity.provider(s.getProviderId());
        if(p==null||!s.getProviderId().toString().equals(p.path("providerProfileId").asText()))throw new org.springframework.dao.DataAccessResourceFailureException("Provider identity unavailable");
        var owner=UUID.fromString(p.path("userId").asText());
        if(!request.participantUserIds().contains(owner)||request.participantUserIds().stream().anyMatch(u->!identity.active(u)))throw new org.springframework.security.access.AccessDeniedException("Service participants required");
        return new VerifiedContext("SERVICE",id,request.participantUserIds(),0,s.getStatus().name());
    }
}
