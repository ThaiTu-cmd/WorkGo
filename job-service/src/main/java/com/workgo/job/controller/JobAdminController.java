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
    public ApiResponse<Page<JobSnapshot>> list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
        @RequestParam(required=false) UUID clientId, @RequestParam(required=false) UUID categoryId,
        @RequestParam(required=false) com.workgo.job.enumeration.JobStatus status,
        @RequestParam(required=false) com.workgo.job.enumeration.ExecutionType executionType,
        @RequestParam(required=false) Boolean hidden,
        @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
        @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to) {
        return ApiResponse.<Page<JobSnapshot>>builder().result(jobs.findAll((root,query,cb)->{
            var predicates=new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if(clientId!=null)predicates.add(cb.equal(root.get("clientId"),clientId));
            if(categoryId!=null)predicates.add(cb.equal(root.get("categoryId"),categoryId));
            if(status!=null)predicates.add(cb.equal(root.get("status"),status));
            if(executionType!=null)predicates.add(cb.equal(root.get("executionType"),executionType));
            if(hidden!=null)predicates.add(cb.equal(root.get("moderationHidden"),hidden));
            if(from!=null)predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),from));
            if(to!=null)predicates.add(cb.lessThan(root.get("createdAt"),to));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        },PageRequest.of(Math.max(page,0),Math.min(Math.max(size,1),100),Sort.by("createdAt").descending())).map(j->new JobSnapshot(mapper.toSummary(j,0),j.getVersion(),j.isModerationHidden()))).build();
    }
    @GetMapping("/jobs/{id}/history") @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<Page<com.workgo.job.service.AuditQueryService.AuditRecord>> history(@PathVariable UUID id,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) {
        jobs.findById(id).orElseThrow(com.workgo.job.exception.JobNotFoundException::new);
        return ApiResponse.<Page<com.workgo.job.service.AuditQueryService.AuditRecord>>builder()
            .result(auditQuery.search(null,id,null,"JOB",null,null,page,size,"createdAt,desc")).build();
    }
    private final com.workgo.job.service.AuditQueryService auditQuery;
    @GetMapping("/audit-logs/export") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public org.springframework.http.ResponseEntity<String> exportAudit(
        @RequestParam(required=false) UUID targetId, @RequestParam(required=false) UUID actorId,
        @RequestParam(required=false) String action, @RequestParam(required=false) String targetType,
        @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
        @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
        @RequestParam(defaultValue="0") int cursor, @RequestParam(defaultValue="1000") int limit) {
        var result=auditQuery.export(actorId,targetId,action,targetType,from,to,cursor,limit);
        return org.springframework.http.ResponseEntity.ok().header("Content-Type","text/csv;charset=UTF-8")
            .header("Content-Disposition","attachment; filename=\"job-audit.csv\"")
            .header("Cache-Control","no-store").header("X-Next-Cursor",result.nextCursor()==null?"":result.nextCursor().toString()).body(result.csv());
    }
    @GetMapping("/audit-logs") @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<Page<com.workgo.job.service.AuditQueryService.AuditRecord>> audit(
        @RequestParam(required=false) UUID targetId, @RequestParam(required=false) UUID actorId,
        @RequestParam(required=false) String action, @RequestParam(required=false) String targetType,
        @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
        @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
        @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size, @RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.<Page<com.workgo.job.service.AuditQueryService.AuditRecord>>builder()
            .result(auditQuery.search(actorId,targetId,action,targetType,from,to,page,size,sort)).build();
    }

}
