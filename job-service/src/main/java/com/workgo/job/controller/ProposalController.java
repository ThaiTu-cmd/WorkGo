package com.workgo.job.controller;

import com.workgo.job.dto.request.ProposalSubmitReq;
import com.workgo.job.dto.response.*;
import com.workgo.job.service.ProposalService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class ProposalController {
    private final ProposalService service;

    @PostMapping("/applications/{id}/proposal") @PreAuthorize("hasAuthority('ROLE_PROVIDER')")
    public ApiResponse<ProposalDto> submit(@PathVariable UUID id, @Valid @RequestBody ProposalSubmitReq req) {
        return ApiResponse.<ProposalDto>builder().result(service.submit(id, req)).build();
    }

    @PostMapping("/proposals/{id}/accept") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<ProposalAcceptanceDto> accept(@PathVariable UUID id) {
        return ApiResponse.<ProposalAcceptanceDto>builder().result(service.accept(id)).build();
    }

    @PostMapping("/proposals/{id}/reject") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<ProposalDto> reject(@PathVariable UUID id) {
        return ApiResponse.<ProposalDto>builder().result(service.reject(id)).build();
    }

    @GetMapping("/jobs/{id}/proposals") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<PageResponse<ProposalDto>> forJob(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<ProposalDto>>builder().result(service.forJob(id, page, size, sort)).build();
    }

    @GetMapping("/proposals/{id}/order-sync") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<ProposalAcceptanceDto> orderSync(@PathVariable UUID id) {
        return ApiResponse.<ProposalAcceptanceDto>builder().result(service.orderSync(id)).build();
    }

    @PostMapping("/proposals/{id}/order-retry") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<ProposalAcceptanceDto> retryOrder(@PathVariable UUID id) {
        return ApiResponse.<ProposalAcceptanceDto>builder().result(service.retryOrder(id)).build();
    }
}
