package com.workgo.payment.service.admin;

import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.AdminActionLogMapper;
import com.workgo.payment.dto.PageResponse;
import com.workgo.payment.dto.response.AdminActionLogResponse;
import com.workgo.payment.entity.AdminActionLog;
import com.workgo.payment.enumeration.AdminActionType;
import com.workgo.payment.reppository.AdminActionLogRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuditLogQueryService {

    static int MAX_PAGE_SIZE = 100;
    static int MAX_EXPORT_ROWS = 1000;
    static Duration MAX_EXPORT_RANGE = Duration.ofDays(92);

    AdminActionLogRepository adminActionLogRepository;
    AdminActionLogMapper adminActionLogMapper;
    AdminAuditService adminAuditService;

    //ADMIN chi xem hanh dong cua chinh minh, SUPER_ADMIN xem toan bo
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public PageResponse<AdminActionLogResponse> searchLogs(UUID actorId, String action, String targetType,
                                                           String targetId, Instant from, Instant to,
                                                           int page, int size) {

        if (page < 0 || size < 1 || from != null && to != null && !from.isBefore(to)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        UUID scopedActorId = isSuperAdmin() ? actorId : currentUserId();

        Page<AdminActionLog> pageData = adminActionLogRepository.search(scopedActorId, action, targetType, targetId,
                from, to, PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by("createdAt", "adminActionLogId").descending()));

        return PageResponse.<AdminActionLogResponse>builder()
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .currentPage(page)
                .data(pageData.stream()
                        .map(log -> {
                            var projection = adminActionLogMapper.toAdminActionLogResponse(log);
                            // Free text and historical DTO snapshots may contain PII. Monitoring is metadata only.
                            projection.setReason(null);
                            projection.setBeforeState(null);
                            projection.setAfterState(null);
                            return projection;
                        })
                        .toList())
                .build();
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public String exportLogs(UUID actorId, String action, String targetType, String targetId,
                             Instant from, Instant to) {

        return exportPage(actorId, action, targetType, targetId, from, to, 0, MAX_EXPORT_ROWS).csv();
    }

    public record ExportPage(String csv, Integer nextCursor) {}

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ExportPage exportPage(UUID actorId, String action, String targetType, String targetId,
                                 Instant from, Instant to, int cursor, int limit) {
        if (cursor < 0 || limit < 1 || limit > MAX_EXPORT_ROWS || (long) cursor * limit > 1_000_000L) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        if (from == null || to == null || !from.isBefore(to) || Duration.between(from, to).compareTo(MAX_EXPORT_RANGE) > 0) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        Page<AdminActionLog> exportData = adminActionLogRepository.search(actorId, action, targetType, targetId, from, to,
                PageRequest.of(cursor, limit, Sort.by("createdAt", "adminActionLogId").ascending()));
        List<AdminActionLog> logs = exportData.getContent();

        StringBuilder csv = new StringBuilder("createdAt,actorId,actorRole,action,targetType,targetId,reason,beforeState,afterState,correlationId,source\n");
        for (AdminActionLog log : logs) {
            csv.append(String.join(",",
                    cell(log.getCreatedAt()), cell(log.getActorId()), cell(log.getActorRole()), cell(log.getAction()),
                    cell(log.getTargetType()), cell(log.getTargetId()), cell(null),
                    cell(null), cell(null), cell(log.getCorrelationId()), cell(log.getSource())))
                    .append("\n");
        }

        Map<String, Object> filter = new LinkedHashMap<>();
        filter.put("actorId", actorId);
        filter.put("action", action);
        filter.put("targetType", targetType);
        filter.put("targetId", targetId);
        filter.put("from", from.toString());
        filter.put("to", to.toString());
        filter.put("rowCount", logs.size());
        filter.put("cursor", cursor);
        filter.put("limit", limit);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.AUDIT_EXPORTED)
                .targetType("AUDIT_LOG")
                .targetId(UUID.randomUUID())
                .afterState(filter)
                .build());

        return new ExportPage(csv.toString(), exportData.hasNext() ? cursor + 1 : null);
    }

    //=====================================

    private boolean isSuperAdmin() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));
    }

    private UUID currentUserId() {

        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        return UUID.fromString(jwt.getClaimAsString("userId"));
    }

    //chong CSV injection khi mo bang Excel
    private String cell(Object value) {

        if (value == null) return "";

        String text = value.toString();
        if (!text.isEmpty() && "=+-@\t\r\n".indexOf(text.charAt(0)) >= 0) text = "'" + text;

        return "\"" + text.replace("\"", "\"\"") + "\"";
    }
}
