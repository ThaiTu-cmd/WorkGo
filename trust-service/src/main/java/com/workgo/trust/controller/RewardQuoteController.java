package com.workgo.trust.controller;
import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.service.RewardQuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/rewards")
public class RewardQuoteController {
    private final RewardQuoteService service;
    private final com.workgo.trust.service.RewardCompletionService completion;
    @PostMapping("/commit")
    public ApiResponse<com.workgo.trust.service.RewardCompletionService.CommitAck> commit(@RequestBody com.workgo.trust.service.RewardCompletionService.Commit c){
        return ApiResponse.<com.workgo.trust.service.RewardCompletionService.CommitAck>builder().result(completion.commit(c)).build();
    }
    @GetMapping("/quotes/{id}") public ApiResponse<RewardQuoteService.Quote> get(@PathVariable java.util.UUID id){return ApiResponse.<RewardQuoteService.Quote>builder().result(service.get(id)).build();}
    @PostMapping("/quotes")
    public ApiResponse<RewardQuoteService.Quote> quote(@RequestBody RewardQuoteService.Input input) {
        return ApiResponse.<RewardQuoteService.Quote>builder().result(service.quote(input)).build();
    }
}
