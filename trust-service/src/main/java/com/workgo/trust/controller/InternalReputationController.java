package com.workgo.trust.controller;
import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.repository.ReputationAccountRepository;
import com.workgo.trust.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/providers")
public class InternalReputationController {
    private final ReputationAccountRepository accounts;
    private final com.workgo.trust.service.ReputationService reputation;
    private final com.workgo.trust.service.RecoveryService recovery;
    @PostMapping("/{id}/recovery")
    public ApiResponse<com.workgo.trust.entity.ReputationAccount> recovery(@PathVariable UUID id,@RequestBody com.workgo.trust.service.RecoveryService.Approval req){return ApiResponse.<com.workgo.trust.entity.ReputationAccount>builder().result(recovery.complete(id,req)).build();}
    public record Approved(String eventId,UUID userId,java.time.Instant approvedAt) {}
    @PostMapping("/{id}/approved")
    public ApiResponse<com.workgo.trust.entity.ReputationAccount> approved(@PathVariable UUID id,@RequestBody Approved req){
        if(req==null||req.userId()==null||req.approvedAt()==null||!java.util.Objects.equals(req.eventId(),"provider-approved:"+id))throw new AppException(ErrorCode.INVALID_REQUEST);
        return ApiResponse.<com.workgo.trust.entity.ReputationAccount>builder().result(reputation.approved(id,req.userId())).build();
    }
    @GetMapping("/{id}/reputation")
    public ApiResponse<ReputationController.Score> score(@PathVariable UUID id){var a=accounts.findById(id).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));return ApiResponse.<ReputationController.Score>builder().result(new ReputationController.Score(id,a.getScore(),"WG-POLICY-1.0")).build();}
}
