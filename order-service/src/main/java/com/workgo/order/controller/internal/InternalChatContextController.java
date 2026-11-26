package com.workgo.order.controller.internal;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.client.IdentityClient;
import com.workgo.order.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/chat-context")
public class InternalChatContextController {
    private final OrderRepository orders;private final IdentityClient identity;
    public record Request(UUID requesterUserId,List<UUID> participantUserIds) {}
    public record VerifiedContext(String canonicalType,UUID canonicalId,List<UUID> allowedUsers,long contextVersion,String lifecycle) {}
    @PostMapping("/{type}/{id}/verify")
    public VerifiedContext verify(@PathVariable String type,@PathVariable UUID id,@RequestBody Request request){
        if(!"ORDER".equals(type))throw new AppException(ErrorCode.INVALID_REQUEST_BODY);
        var o=orders.findById(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        var p=identity.getProviderProfile(o.getProviderId());
        if(p==null||!o.getProviderId().equals(p.getProviderProfileId())||p.getUserId()==null)throw new AppException(ErrorCode.PROVIDER_ADMISSION_UNAVAILABLE);
        var allowed=List.of(o.getClientId(),p.getUserId());
        if(request==null||request.participantUserIds()==null||request.participantUserIds().size()!=2
                ||!request.participantUserIds().contains(request.requesterUserId())||!new HashSet<>(allowed).equals(new HashSet<>(request.participantUserIds())))
            throw new org.springframework.security.access.AccessDeniedException("Order participants required");
        return new VerifiedContext(type,id,allowed,o.getVersion()==null?0:o.getVersion(),o.getOrderStatus().name());
    }
}
