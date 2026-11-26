package com.workgo.trust.controller;
import com.workgo.trust.repository.DisputeRepository;
import com.workgo.trust.repository.client.IdentityClient;
import com.workgo.trust.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/chat-context")
public class InternalChatContextController {
    private final DisputeRepository disputes;private final IdentityClient identity;
    public record Request(UUID requesterUserId,List<UUID> participantUserIds) {}
    public record VerifiedContext(String canonicalType,UUID canonicalId,List<UUID> allowedUsers,long contextVersion,String lifecycle) {}
    @PostMapping("/{type}/{id}/verify")
    public VerifiedContext verify(@PathVariable String type,@PathVariable UUID id,@RequestBody Request request){
        if(!"DISPUTE".equals(type))throw new AppException(ErrorCode.INVALID_REQUEST);
        var d=disputes.findById(id).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
        var p=identity.getProviderProfile(d.getProviderId());
        if(p==null||!d.getProviderId().equals(p.providerProfileId())||p.userId()==null)throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        var allowed=new ArrayList<>(List.of(d.getClientId(),p.userId()));if(d.getAssignedAdminId()!=null)allowed.add(d.getAssignedAdminId());
        if(request==null||request.participantUserIds()==null||request.participantUserIds().size()!=2
                ||!request.participantUserIds().contains(request.requesterUserId())||!allowed.containsAll(request.participantUserIds()))
            throw new org.springframework.security.access.AccessDeniedException("Case participants required");
        return new VerifiedContext(type,id,allowed,d.getVersion()==null?0:d.getVersion(),d.getStatus().name());
    }
}
