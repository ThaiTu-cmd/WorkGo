package com.workgo.job.controller;

import com.workgo.job.dto.response.*;
import com.workgo.job.entity.JobAdminAudit;
import com.workgo.job.mapper.JobMapper;
import com.workgo.job.repository.*;
import com.workgo.job.service.JobAdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/admin") @RequiredArgsConstructor
public class JobAdminController {
    private final JobAdminService service;
    private final JobRepository jobs;
    private final JobAdminAuditRepository audit;
    private final JobMapper mapper;
    public record Moderation(@NotNull Boolean hidden, @NotBlank @Size(max=1000) String reason, @NotNull @PositiveOrZero Long expectedVersion) {}
    public record ModerationResult(UUID jobId, boolean hidden, long version) {}
    public record JobSnapshot(JobSummaryDto job,Long version,boolean moderationHidden) {}
    @GetMapping("/jobs/{id}") @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<JobSnapshot> detail(@PathVariable UUID id) {
        var j=jobs.findById(id).orElseThrow(com.workgo.job.exception.JobNotFoundException::new);
        return ApiResponse.<JobSnapshot>builder().result(new JobSnapshot(mapper.toSummary(j,0),j.getVersion(),j.isModerationHidden())).build();
    }
    @RequestMapping(value="/jobs/{id}/moderation",method={RequestMethod.PUT,RequestMethod.PATCH}) @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ModerationResult> moderate(@PathVariable UUID id, @Valid @RequestBody Moderation req) {
        var j=service.moderate(id,req.hidden(),req.reason(),req.expectedVersion());
        return ApiResponse.<ModerationResult>builder().result(new ModerationResult(id,j.isModerationHidden(),j.getVersion())).build();
    }
    @GetMapping("/jobs") @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<Page<JobSnapshot>> list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.<Page<JobSnapshot>>builder().result(jobs.findAll(PageRequest.of(Math.max(page,0),Math.min(Math.max(size,1),100),Sort.by("createdAt").descending())).map(j->new JobSnapshot(mapper.toSummary(j,0),j.getVersion(),j.isModerationHidden()))).build();
    }
    @GetMapping("/audit-logs") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Page<JobAdminAudit>> audit(@RequestParam UUID targetId, @RequestParam(defaultValue="0") int page) {
        return ApiResponse.<Page<JobAdminAudit>>builder().result(audit.findByTargetId(targetId,PageRequest.of(Math.max(page,0),50,Sort.by("createdAt").descending()))).build();
    }
}
