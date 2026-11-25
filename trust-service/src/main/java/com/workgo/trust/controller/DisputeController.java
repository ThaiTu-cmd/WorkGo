package com.workgo.trust.controller;

import com.workgo.trust.dto.request.*;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.service.DisputeService;
import com.workgo.trust.utils.TokenUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/disputes")
@RequiredArgsConstructor
public class DisputeController {
    private final DisputeService service;
    private final TokenUtils tokens;
    private final com.workgo.trust.repository.DisputeDecisionRepository decisions;

    public record DecisionProgress(
            UUID decisionId,
            String operation,
            java.time.Instant effectiveAt,
            String reason,
            String paymentStatus,
            String orderStatus,
            String executionStatus,
            String timerStatus,
            String lastError,
            boolean terminalConflict) {}

    @GetMapping("/{id}/decision")
    public ApiResponse<DecisionProgress> decision(@PathVariable UUID id) {
        service.get(id, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull());
        var d = decisions.findByDisputeId(id).orElseThrow(() -> new com.workgo.trust.exception.AppException(com.workgo.trust.exception.ErrorCode.TARGET_NOT_FOUND));
        return ApiResponse.<DecisionProgress>builder().result(new DecisionProgress(
                d.getDecisionId(), d.getOperation(), d.getEffectiveAt(), d.getReason(),
                d.getPaymentStatus(), d.getOrderStatus(), d.getExecutionStatus(),
                d.getTimerStatus(), d.getLastError(), d.isTerminalConflict())).build();
    }

    @PostMapping
    public ApiResponse<DisputeDto> create(@Valid @RequestBody DisputeCreateReq req) {
        return ApiResponse.<DisputeDto>builder().result(service.create(req, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @PostMapping("/onsite/contacts")
    public ApiResponse<OnsiteIncidentDto> recordOnsiteContact(@Valid @RequestBody OnsiteContactNoticeReq req) {
        return ApiResponse.<OnsiteIncidentDto>builder().result(
                service.recordOnsiteContact(req, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @PostMapping("/onsite/reschedule/propose")
    public ApiResponse<OnsiteIncidentDto> proposeOnsiteReschedule(@Valid @RequestBody OnsiteRescheduleReq req) {
        return ApiResponse.<OnsiteIncidentDto>builder().result(
                service.proposeOnsiteReschedule(req, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @PostMapping("/onsite/reschedule/confirm")
    public ApiResponse<OnsiteIncidentDto> confirmOnsiteReschedule(@Valid @RequestBody OnsiteRescheduleReq req) {
        return ApiResponse.<OnsiteIncidentDto>builder().result(
                service.confirmOnsiteReschedule(req, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @PostMapping("/onsite/incidents")
    public ApiResponse<OnsiteIncidentDto> reportOnsiteIncident(@Valid @RequestBody OnsiteIncidentReq req) {
        return ApiResponse.<OnsiteIncidentDto>builder().result(
                service.reportOnsiteIncident(req, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @GetMapping("/orders/{id}/onsite-incident")
    public ApiResponse<OnsiteIncidentDto> getOnsiteIncident(@PathVariable UUID id) {
        return ApiResponse.<OnsiteIncidentDto>builder().result(
                service.getOnsiteIncident(id, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<DisputeDto> cancel(@PathVariable UUID id, @Valid @RequestBody(required = false) DisputeCancelReq req) {
        return ApiResponse.<DisputeDto>builder().result(service.cancel(id, req, tokens.getCurrentUserId())).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<DisputeDto> get(@PathVariable UUID id) {
        return ApiResponse.<DisputeDto>builder().result(service.get(id, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<List<DisputeDto>> order(@PathVariable UUID id) {
        return ApiResponse.<List<DisputeDto>>builder().result(service.orderDisputes(id, tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull())).build();
    }

    @GetMapping("/my-disputes")
    public ApiResponse<PageResponse<DisputeDto>> mine(
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<DisputeDto>>builder().result(service.myDisputes(tokens.getCurrentUserId(), tokens.getCurrentProviderIdOrNull(), status, page, size)).build();
    }
}
