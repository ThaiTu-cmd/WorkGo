package com.workgo.trust.controller;

import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.entity.*;
import com.workgo.trust.enumeration.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.service.TrustAdminService;
import com.workgo.trust.exception.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/admin") @RequiredArgsConstructor
public class TrustAdminController {
    private final TrustAdminService service;
    private final com.workgo.trust.service.DecisionService decisionService;
    private final DisputeDecisionRepository decisions;
    private final ReviewRepository reviews;
    private final ReportRepository reports;
    private final DisputeRepository disputes;
    private final TrustAdminAuditRepository audits;
    public record Change<T>(@NotNull T status,@NotBlank @Size(max=1000) String reason,@NotNull @PositiveOrZero Long expectedVersion) {}
    public record CaseAction(@NotBlank @Size(max=1000) String reason,@NotNull @PositiveOrZero Long expectedVersion) {}
    public record Resolve(@NotNull String operation,@NotNull String branch,@NotBlank @Size(max=1000) String reason,
            @NotBlank @Size(max=2000) String evidenceSummary,@NotNull @PositiveOrZero Long expectedVersion,
            String faultType,@Min(0) @Max(6) Integer lateCycles,UUID supersedesDecisionId) {}
    @PostMapping("/disputes/{id}/resolve") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DisputeDecision> resolve(@PathVariable UUID id,@Valid @RequestBody Resolve req){return ApiResponse.<DisputeDecision>builder().result(decisionService.decide(id,req.operation(),req.branch(),req.reason(),req.evidenceSummary(),req.expectedVersion(),req.faultType(),req.lateCycles(),req.supersedesDecisionId())).build();}
    @GetMapping("/disputes/{id}/decision") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DisputeDecision> decision(@PathVariable UUID id){return ApiResponse.<DisputeDecision>builder().result(decisions.findByDisputeId(id).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND))).build();}
    @PostMapping("/decisions/{id}/retry") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DisputeDecision> retry(@PathVariable UUID id,@Valid @RequestBody CaseAction req){return ApiResponse.<DisputeDecision>builder().result(decisionService.retry(id,req.reason(),req.expectedVersion())).build();}
    @PutMapping("/reviews/{id}/moderation") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Review> moderate(@PathVariable UUID id,@Valid @RequestBody Change<ModerationStatus> req){return ApiResponse.<Review>builder().result(service.moderate(id,req.status(),req.reason(),req.expectedVersion())).build();}
    @PutMapping("/reports/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Report> report(@PathVariable UUID id,@Valid @RequestBody Change<ReportStatus> req){return ApiResponse.<Report>builder().result(service.report(id,req.status(),req.reason(),req.expectedVersion())).build();}
    @PostMapping("/disputes/{id}/take-over") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Dispute> take(@PathVariable UUID id,@Valid @RequestBody CaseAction req){return ApiResponse.<Dispute>builder().result(service.take(id,req.reason(),req.expectedVersion())).build();}
    @PostMapping("/disputes/{id}/evidence-request") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Dispute> evidence(@PathVariable UUID id,@Valid @RequestBody CaseAction req){return ApiResponse.<Dispute>builder().result(service.requestEvidence(id,req.reason(),req.expectedVersion())).build();}
    @GetMapping("/reviews") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<Review>> reviews(@RequestParam(defaultValue="0") int page){return ApiResponse.<Page<Review>>builder().result(reviews.findAll(paging(page))).build();}
    @GetMapping("/reviews/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Review> review(@PathVariable UUID id){return ApiResponse.<Review>builder().result(reviews.findById(id).orElseThrow(()->new AppException(ErrorCode.REVIEW_NOT_FOUND))).build();}
    @GetMapping("/reports") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<Report>> reports(@RequestParam(defaultValue="0") int page){return ApiResponse.<Page<Report>>builder().result(reports.findAll(paging(page))).build();}
    @GetMapping("/reports/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Report> report(@PathVariable UUID id){return ApiResponse.<Report>builder().result(reports.findById(id).orElseThrow(()->new AppException(ErrorCode.REPORT_NOT_FOUND))).build();}
    @GetMapping("/disputes") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<Dispute>> disputes(@RequestParam(defaultValue="0") int page){return ApiResponse.<Page<Dispute>>builder().result(disputes.findAll(paging(page))).build();}
    @GetMapping("/disputes/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Dispute> dispute(@PathVariable UUID id){return ApiResponse.<Dispute>builder().result(disputes.findById(id).orElseThrow(DisputeNotFoundException::new)).build();}
    private final com.workgo.trust.service.AuditQueryService auditQuery;
    @GetMapping("/audit-logs/export") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public org.springframework.http.ResponseEntity<String> exportAudit(
        @RequestParam(required=false) UUID targetId, @RequestParam(required=false) UUID actorId,
        @RequestParam(required=false) String action, @RequestParam(required=false) String targetType,
        @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
        @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
        @RequestParam(defaultValue="0") int cursor, @RequestParam(defaultValue="1000") int limit) {
        var result=auditQuery.export(actorId,targetId,action,targetType,from,to,cursor,limit);
        return org.springframework.http.ResponseEntity.ok().header("Content-Type","text/csv;charset=UTF-8")
            .header("Content-Disposition","attachment; filename=\"trust-audit.csv\"")
            .header("Cache-Control","no-store").header("X-Next-Cursor",result.nextCursor()==null?"":result.nextCursor().toString()).body(result.csv());
    }
    @GetMapping("/audit-logs") @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<Page<com.workgo.trust.service.AuditQueryService.AuditRecord>> audit(
        @RequestParam(required=false) UUID targetId, @RequestParam(required=false) UUID actorId,
        @RequestParam(required=false) String action, @RequestParam(required=false) String targetType,
        @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
        @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
        @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size, @RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.<Page<com.workgo.trust.service.AuditQueryService.AuditRecord>>builder()
            .result(auditQuery.search(actorId,targetId,action,targetType,from,to,page,size,sort)).build();
    }

    private Pageable paging(int page){return PageRequest.of(Math.max(0,page),50,Sort.by("createdAt").descending());}
}
