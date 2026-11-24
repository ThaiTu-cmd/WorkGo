package com.workgo.trust.controller;
import com.workgo.trust.dto.request.InternalOrderCompletedEventReq;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.service.InternalTrustService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalTrustController {
    private final InternalTrustService service;
    private final com.workgo.trust.service.ReputationService reputation;
    private final com.workgo.trust.service.RewardService rewards;
    @PostMapping("/rewards/snapshots")
    public ApiResponse<com.workgo.trust.entity.RewardSnapshot> rewardSnapshot(@Valid @RequestBody com.workgo.trust.service.RewardService.SnapshotRequest req) {
        return ApiResponse.<com.workgo.trust.entity.RewardSnapshot>builder().result(rewards.lock(req)).build();
    }
    @PostMapping("/rewards/{id}/grant")
    public ApiResponse<com.workgo.trust.entity.ReputationAccount> reward(@PathVariable UUID id) {
        return ApiResponse.<com.workgo.trust.entity.ReputationAccount>builder().result(rewards.grant(id)).build();
    }
    @PostMapping("/reputation/penalties")
    public ApiResponse<com.workgo.trust.entity.ReputationAccount> penalty(@Valid @RequestBody com.workgo.trust.service.ReputationService.Penalty req) {
        return ApiResponse.<com.workgo.trust.entity.ReputationAccount>builder().result(reputation.penalize(req)).build();
    }
    @PostMapping("/events/order-completed")
    public ApiResponse<Void> completed(@Valid @RequestBody InternalOrderCompletedEventReq req) {
        service.orderCompleted(req); return ApiResponse.<Void>builder().build();
    }
    @GetMapping("/orders/{id}/dispute-status")
    public InternalOrderDisputeStatusResponse status(@PathVariable UUID id) { return service.disputeStatus(id); }
}
