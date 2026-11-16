package com.workgo.job.controller;

import com.workgo.job.dto.request.ApplicationCreateReq;
import com.workgo.job.dto.response.*;
import com.workgo.job.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService service;

    @PostMapping("/jobs/{id}/applications") @PreAuthorize("hasAuthority('ROLE_PROVIDER')")
    public ApiResponse<ApplicationDto> apply(@PathVariable UUID id, @Valid @RequestBody ApplicationCreateReq req) {
        return ApiResponse.<ApplicationDto>builder().result(service.apply(id, req)).build();
    }

    @GetMapping("/jobs/{id}/applications") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<PageResponse<ApplicationDto>> forJob(@PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<ApplicationDto>>builder().result(service.forJob(id, page, size, sort)).build();
    }

    @GetMapping("/applications/my-applications") @PreAuthorize("hasAuthority('ROLE_PROVIDER')")
    public ApiResponse<PageResponse<ApplicationDto>> mine(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<ApplicationDto>>builder().result(service.mine(page, size, sort)).build();
    }
}
