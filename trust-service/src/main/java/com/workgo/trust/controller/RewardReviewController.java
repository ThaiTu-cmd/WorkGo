package com.workgo.trust.controller;
import com.workgo.trust.service.RewardReviewService;import com.workgo.trust.repository.RewardReviewRepository;import com.workgo.trust.entity.RewardReview;
import com.workgo.trust.dto.response.ApiResponse;import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import org.springframework.security.access.prepost.PreAuthorize;import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/admin/reward-reviews")
public class RewardReviewController {
    private final RewardReviewRepository reviews;private final RewardReviewService service;
    private final com.workgo.trust.repository.RewardSnapshotRepository snapshots;
    private final com.workgo.trust.repository.RewardCommitReceiptRepository commits;
    private final com.workgo.trust.service.RewardQuoteService quotes;
    public record Detail(RewardReview review,com.workgo.trust.entity.RewardSnapshot snapshot,com.workgo.trust.service.RewardQuoteService.Quote quote){}
    @GetMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Detail> detail(@PathVariable UUID id){
        var review=reviews.findById(id).orElseThrow(()->new com.workgo.trust.exception.AppException(com.workgo.trust.exception.ErrorCode.TARGET_NOT_FOUND));
        var snapshot=snapshots.findById(id).orElseThrow(()->new com.workgo.trust.exception.AppException(com.workgo.trust.exception.ErrorCode.TARGET_NOT_FOUND));
        var matching=commits.findByOrderIdAndInputHash(id,snapshot.getInputHash()).stream()
                .filter(r->r.getConfirmedAt().equals(snapshot.getLockedAt())&&r.getProviderId().equals(snapshot.getProviderId())&&r.getClientId().equals(snapshot.getClientId())).toList();
        if(matching.size()>1)throw new com.workgo.trust.exception.AppException(com.workgo.trust.exception.ErrorCode.INVALID_REQUEST);
        var quote=matching.isEmpty()?null:quotes.get(matching.getFirst().getQuoteId());
        return ApiResponse.<Detail>builder().result(new Detail(review,snapshot,quote)).build();
    }
    public record Review(int points,String reason,Long expectedVersion){}
    @GetMapping @PreAuthorize("hasRole('ADMIN')")public ApiResponse<List<RewardReview>> list(){return ApiResponse.<List<RewardReview>>builder().result(reviews.findTop100ByStatusOrderByDueAtAsc("PENDING")).build();}
    @PostMapping("/{id}")public ApiResponse<RewardReview> review(@PathVariable UUID id,@RequestBody Review req){return ApiResponse.<RewardReview>builder().result(service.resolve(id,req.points(),req.reason(),req.expectedVersion())).build();}
}
