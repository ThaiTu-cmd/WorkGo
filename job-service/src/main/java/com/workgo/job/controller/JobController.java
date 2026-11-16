package com.workgo.job.controller;

import com.workgo.job.dto.request.*;
import com.workgo.job.dto.response.*;
import com.workgo.job.enumeration.ExecutionType;
import com.workgo.job.service.JobService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/jobs") @RequiredArgsConstructor
public class JobController {
    private final JobService service;

    @GetMapping
    public ApiResponse<PageResponse<JobSummaryDto>> search(@RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId, @RequestParam(required = false) ExecutionType executionType,
            @RequestParam(required = false) BigDecimal minBudget, @RequestParam(required = false) BigDecimal maxBudget,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<JobSummaryDto>>builder().result(service.search(keyword, categoryId, executionType,
                minBudget, maxBudget, page, size, sort)).build();
    }

    @GetMapping("/my-jobs") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<PageResponse<JobSummaryDto>> mine(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<JobSummaryDto>>builder().result(service.mine(page, size, sort)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<JobDetailDto> detail(@PathVariable UUID id) {
        return ApiResponse.<JobDetailDto>builder().result(service.detail(id)).build();
    }

    @PostMapping @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<JobDetailDto> create(@Valid @RequestBody JobCreateReq req) {
        return ApiResponse.<JobDetailDto>builder().result(service.create(req)).build();
    }

    @PutMapping("/{id}") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<JobDetailDto> update(@PathVariable UUID id, @Valid @RequestBody JobUpdateReq req) {
        return ApiResponse.<JobDetailDto>builder().result(service.update(id, req)).build();
    }
}
