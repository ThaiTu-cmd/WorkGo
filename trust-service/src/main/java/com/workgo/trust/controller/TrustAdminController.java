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
    public record EvidenceExtensionReq(@NotBlank String party, @NotNull java.time.Instant requestedUntil,
            @NotBlank @Size(max=1000) String reason, @NotNull @PositiveOrZero Long expectedVersion) {}
    public record Resolve(@NotNull String operation,@NotNull String branch,@NotBlank @Size(max=1000) String reason,
            @NotBlank @Size(max=2000) String evidenceSummary,@NotNull @PositiveOrZero Long expectedVersion,
            String faultType,@Min(0) @Max(6) Integer lateCycles,UUID supersedesDecisionId,
            com.workgo.trust.service.DecisionService.CashEvidence cash,boolean seriousEvidenceError) {}
    @PostMapping("/disputes/{id}/resolve") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DisputeDecision> resolve(@PathVariable UUID id,@Valid @RequestBody Resolve req){return ApiResponse.<DisputeDecision>builder().result(decisionService.decide(id,req.operation(),req.branch(),req.reason(),req.evidenceSummary(),req.expectedVersion(),req.faultType(),req.lateCycles(),req.supersedesDecisionId(),req.cash(),req.seriousEvidenceError())).build();}
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
    @PostMapping("/disputes/{id}/evidence-extension") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TrustAdminService.EvidenceExtensionResult> extendEvidence(@PathVariable UUID id,@Valid @RequestBody EvidenceExtensionReq req){
        return ApiResponse.<TrustAdminService.EvidenceExtensionResult>builder()
                .result(service.extendEvidence(id,req.party(),req.requestedUntil(),req.reason(),req.expectedVersion())).build();
    }
    @GetMapping("/reviews") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<Review>> reviews(
            @RequestParam(required=false) ModerationStatus status,
            @RequestParam(required=false) ModerationStatus moderationStatus,
            @RequestParam(required=false) UUID targetId,
            @RequestParam(required=false) UUID orderId,
            @RequestParam(required=false) UUID revieweeId,
            @RequestParam(required=false) UUID reviewerId,
            @RequestParam(required=false) UUID serviceId,
            @RequestParam(required=false) ReviewDirection direction,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size,
            @RequestParam(defaultValue="createdAt,desc") String sort) {
        ModerationStatus effectiveStatus = status != null ? status : moderationStatus;
        Pageable pageable = allowlistedPage(page, size, sort, from, to, java.util.Set.of("createdAt,desc","createdAt,asc","updatedAt,desc","updatedAt,asc","rating,desc","rating,asc"));
        return ApiResponse.<Page<Review>>builder().result(reviews.findAll((root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (effectiveStatus != null) predicates.add(cb.equal(root.get("moderationStatus"), effectiveStatus));
            if (orderId != null) predicates.add(cb.equal(root.get("orderId"), orderId));
            if (revieweeId != null) predicates.add(cb.equal(root.get("revieweeId"), revieweeId));
            if (reviewerId != null) predicates.add(cb.equal(root.get("reviewerId"), reviewerId));
            if (serviceId != null) predicates.add(cb.equal(root.get("serviceId"), serviceId));
            if (direction != null) predicates.add(cb.equal(root.get("direction"), direction));
            if (targetId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("revieweeId"), targetId),
                        cb.equal(root.get("serviceId"), targetId),
                        cb.equal(root.get("orderId"), targetId)
                ));
            }
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(cb.lessThan(root.get("createdAt"), to));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, pageable)).build();
    }
    @GetMapping("/reviews/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Review> review(@PathVariable UUID id){return ApiResponse.<Review>builder().result(reviews.findById(id).orElseThrow(()->new AppException(ErrorCode.REVIEW_NOT_FOUND))).build();}
    @GetMapping("/reports") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<Report>> reports(
            @RequestParam(required=false) ReportStatus status,
            @RequestParam(required=false) UUID assigneeId,
            @RequestParam(required=false) UUID handledBy,
            @RequestParam(required=false) UUID targetId,
            @RequestParam(required=false) ReportTargetType targetType,
            @RequestParam(required=false) UUID reporterId,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size,
            @RequestParam(defaultValue="createdAt,desc") String sort) {
        UUID effectiveAssignee = assigneeId != null ? assigneeId : handledBy;
        ReportTargetType effectiveType = targetType == ReportTargetType.JOB ? ReportTargetType.POST : targetType;
        Pageable pageable = allowlistedPage(page, size, sort, from, to, java.util.Set.of("createdAt,desc","createdAt,asc","updatedAt,desc","updatedAt,asc"));
        return ApiResponse.<Page<Report>>builder().result(reports.findAll((root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (effectiveAssignee != null) predicates.add(cb.equal(root.get("handledBy"), effectiveAssignee));
            if (targetId != null) predicates.add(cb.equal(root.get("targetId"), targetId));
            if (effectiveType != null) predicates.add(cb.equal(root.get("targetType"), effectiveType));
            if (reporterId != null) predicates.add(cb.equal(root.get("reporterId"), reporterId));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(cb.lessThan(root.get("createdAt"), to));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, pageable)).build();
    }
    @GetMapping("/reports/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Report> report(@PathVariable UUID id){return ApiResponse.<Report>builder().result(reports.findById(id).orElseThrow(()->new AppException(ErrorCode.REPORT_NOT_FOUND))).build();}
    @GetMapping("/disputes") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<Dispute>> disputes(
            @RequestParam(required=false) DisputeStatus status,
            @RequestParam(required=false) UUID assigneeId,
            @RequestParam(required=false) UUID assignedAdminId,
            @RequestParam(required=false) UUID targetId,
            @RequestParam(required=false) UUID orderId,
            @RequestParam(required=false) UUID clientId,
            @RequestParam(required=false) UUID providerId,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant from,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant to,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size,
            @RequestParam(defaultValue="createdAt,desc") String sort) {
        UUID effectiveAssignee = assigneeId != null ? assigneeId : assignedAdminId;
        Pageable pageable = allowlistedPage(page, size, sort, from, to, java.util.Set.of("createdAt,desc","createdAt,asc","updatedAt,desc","updatedAt,asc","claimedAt,desc","claimedAt,asc"));
        return ApiResponse.<Page<Dispute>>builder().result(disputes.findAll((root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (effectiveAssignee != null) predicates.add(cb.equal(root.get("assignedAdminId"), effectiveAssignee));
            if (orderId != null) predicates.add(cb.equal(root.get("orderId"), orderId));
            if (clientId != null) predicates.add(cb.equal(root.get("clientId"), clientId));
            if (providerId != null) predicates.add(cb.equal(root.get("providerId"), providerId));
            if (targetId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("orderId"), targetId),
                        cb.equal(root.get("clientId"), targetId),
                        cb.equal(root.get("providerId"), targetId)
                ));
            }
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(cb.lessThan(root.get("createdAt"), to));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, pageable)).build();
    }
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

    private Pageable allowlistedPage(int page, int size, String sort, java.time.Instant from, java.time.Instant to, java.util.Set<String> allowedSorts) {
        if (page < 0 || size < 1 || size > 100 || (from != null && to != null && !from.isBefore(to))) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (sort == null || !allowedSorts.contains(sort)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String[] parts = sort.split(",");
        Sort ordering = Sort.by(parts[0]);
        ordering = "asc".equalsIgnoreCase(parts[1]) ? ordering.ascending() : ordering.descending();
        return PageRequest.of(page, size, ordering);
    }
}
