package com.workgo.trust.controller;
import com.workgo.trust.dto.request.ReviewSubmitReq;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.enumeration.ReviewDirection;
import com.workgo.trust.service.ReviewService;
import com.workgo.trust.utils.TokenUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor
public class ReviewController {
    private final ReviewService service;
    private final TokenUtils tokens;
    @PostMapping("/reviews")
    public ApiResponse<ReviewDto> submit(@Valid @RequestBody ReviewSubmitReq req) {
        return ApiResponse.<ReviewDto>builder().result(service.submit(req,tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull())).build();
    }
    @GetMapping("/providers/{id}/reviews")
    public ApiResponse<RatingSummaryDto> provider(@PathVariable UUID id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<RatingSummaryDto>builder().result(service.providerReviews(id,page,size)).build();
    }
    @GetMapping("/services/{id}/reviews")
    public ApiResponse<RatingSummaryDto> service(@PathVariable UUID id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<RatingSummaryDto>builder().result(service.serviceReviews(id,page,size)).build();
    }
    @GetMapping("/clients/{id}/reviews")
    public ApiResponse<RatingSummaryDto> client(@PathVariable UUID id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<RatingSummaryDto>builder().result(service.clientReviews(id,page,size)).build();
    }
    @GetMapping("/reviews/orders/{id}")
    public ApiResponse<OrderReviewStatusDto> order(@PathVariable UUID id) {
        return ApiResponse.<OrderReviewStatusDto>builder().result(service.orderStatus(id,tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull())).build();
    }
    @GetMapping("/reviews/my-reviews")
    public ApiResponse<PageResponse<ReviewDto>> mine(@RequestParam(required=false) ReviewDirection direction,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<PageResponse<ReviewDto>>builder().result(service.myReviews(tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull(),direction,page,size)).build();
    }
}
