package com.workgo.identity.controller;
import com.workgo.identity.service.ProviderSanctionService;
import com.workgo.identity.entity.*;
import com.workgo.identity.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor
public class ProviderSanctionController {
    private final ProviderSanctionService service;
    private final com.workgo.identity.repository.SanctionAppealRepository appeals;
    @GetMapping("/sanction-appeals/me")public ApiResponse<java.util.List<SanctionAppeal>> mine(){return ApiResponse.<java.util.List<SanctionAppeal>>builder().code(1000).result(appeals.findByUserIdOrderBySubmittedAtDesc(service.actor())).build();}
    @GetMapping("/sanction-appeals/pending")@org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")public ApiResponse<java.util.List<SanctionAppeal>> pending(){return ApiResponse.<java.util.List<SanctionAppeal>>builder().code(1000).result(appeals.findTop100ByStatusOrderBySubmittedAtAsc("PENDING")).build();}
    public record Appeal(String explanation) {}
    public record Review(boolean accepted,String reason,Long expectedVersion) {}
    @GetMapping("/providers/{id}/sanctions")
    public ApiResponse<java.util.List<ProviderSanction>> list(@PathVariable UUID id){return ApiResponse.<java.util.List<ProviderSanction>>builder().code(1000).result(service.list(id)).build();}
    @PostMapping("/providers/{id}/sanctions")
    public ApiResponse<ProviderSanction> create(@PathVariable UUID id,@RequestBody ProviderSanctionService.Create req){return ApiResponse.<ProviderSanction>builder().code(1000).result(service.create(id,req)).build();}
    @PostMapping("/sanctions/{id}/appeals")
    public ApiResponse<SanctionAppeal> appeal(@PathVariable UUID id,@RequestBody Appeal req){return ApiResponse.<SanctionAppeal>builder().code(1000).result(service.appeal(id,req.explanation())).build();}
    @PostMapping("/sanction-appeals/{id}/review")
    public ApiResponse<SanctionAppeal> review(@PathVariable UUID id,@RequestBody Review req){return ApiResponse.<SanctionAppeal>builder().code(1000).result(service.review(id,req.accepted(),req.reason(),req.expectedVersion())).build();}
    @GetMapping("/internal/providers/{id}/admission")
    public ProviderSanctionService.Admission admission(@PathVariable UUID id){return service.admission(id);}
    public record PayoutEligibility(UUID userId,boolean allowed) {}
    @GetMapping("/internal/users/{id}/payout-eligibility")
    public PayoutEligibility payout(@PathVariable UUID id){return new PayoutEligibility(id,service.payoutAllowed(id));}
}
