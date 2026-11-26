package com.workgo.job.controller;
import com.workgo.job.repository.*;
import com.workgo.job.repository.client.IdentityClient;
import com.workgo.job.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/chat-context")
public class InternalChatContextController {
    private final JobRepository jobs;private final ApplicationRepository applications;private final IdentityClient identity;
    public record Request(UUID requesterUserId,List<UUID> participantUserIds) {}
    public record VerifiedContext(String canonicalType,UUID canonicalId,List<UUID> allowedUsers,long contextVersion,String lifecycle) {}
    @PostMapping("/{type}/{id}/verify")
    public VerifiedContext verify(@PathVariable String type,@PathVariable UUID id,@RequestBody Request request){
        if(!"POST".equals(type)||request==null||request.participantUserIds()==null||request.participantUserIds().size()!=2||!request.participantUserIds().contains(request.requesterUserId()))throw new AppException(ErrorCode.INVALID_REQUEST);
        var job=jobs.findById(id).orElseThrow(JobNotFoundException::new);
        if(!request.participantUserIds().contains(job.getClientId()))throw new org.springframework.security.access.AccessDeniedException("Job owner required");
        var user=request.participantUserIds().stream().filter(u->!u.equals(job.getClientId())).findFirst().orElseThrow();
        var p=identity.byUser(user);
        if(p==null||!user.equals(p.getUserId())||p.getProviderProfileId()==null||!applications.existsByJob_JobIdAndProviderId(id,p.getProviderProfileId()))throw new org.springframework.security.access.AccessDeniedException("Job applicant required");
        return new VerifiedContext("POST",id,request.participantUserIds(),job.getVersion()==null?0:job.getVersion(),job.getStatus().name());
    }
}
