package com.workgo.identity.controller;
import com.workgo.identity.service.ProviderScoreReviewService;
import com.workgo.identity.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor
public class ProviderScoreReviewController {
    private final ProviderScoreReviewService service;
    @GetMapping("/admin/provider-score-reviews/pending")
    public ApiResponse<List<ProviderScoreReviewService.Pending>> pending(){return ApiResponse.<List<ProviderScoreReviewService.Pending>>builder().code(1000).result(service.pending()).build();}
    @PostMapping("/providers/{id}/score-review")
    public ApiResponse<ProviderScoreReviewService.Receipt> review(@PathVariable UUID id,@RequestBody ProviderScoreReviewService.Command request){return ApiResponse.<ProviderScoreReviewService.Receipt>builder().code(1000).result(service.review(id,request)).build();}
    @GetMapping("/providers/{id}/score-reviews")
    public ApiResponse<List<ProviderScoreReviewService.Receipt>> history(@PathVariable UUID id){return ApiResponse.<List<ProviderScoreReviewService.Receipt>>builder().code(1000).result(service.history(id)).build();}
}
