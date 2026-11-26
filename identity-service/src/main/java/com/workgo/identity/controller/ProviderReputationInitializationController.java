package com.workgo.identity.controller;
import com.workgo.identity.service.ProviderReputationInitializationService;import com.workgo.identity.entity.ProviderTrustEvent;import com.workgo.identity.dto.ApiResponse;
import org.springframework.web.bind.annotation.*;import lombok.RequiredArgsConstructor;import java.util.UUID;
@RestController @RequiredArgsConstructor
public class ProviderReputationInitializationController {
 private final ProviderReputationInitializationService service;
 public record Request(String reason){}
 @PostMapping("/providers/{id}/reputation-initialization")public ApiResponse<ProviderTrustEvent> initialize(@PathVariable UUID id,@RequestBody Request request){return ApiResponse.<ProviderTrustEvent>builder().code(1000).result(service.initialize(id,request.reason())).build();}
}
