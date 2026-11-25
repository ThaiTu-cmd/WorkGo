package com.workgo.payment.controller.admin;

import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.PageResponse;
import com.workgo.payment.dto.response.AdminActionLogResponse;
import com.workgo.payment.service.admin.AuditLogQueryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/admin/audit-logs")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AdminAuditLogController {

    AuditLogQueryService auditLogQueryService;

    @GetMapping
    ApiResponse<PageResponse<AdminActionLogResponse>> searchLogs(
            @RequestParam(value = "actorId", required = false) UUID actorId,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "targetType", required = false) String targetType,
            @RequestParam(value = "targetId", required = false) String targetId,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<AdminActionLogResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(auditLogQueryService.searchLogs(actorId, action, targetType, targetId, from, to, page, size))
                .build();
    }

    @GetMapping("/export")
    ResponseEntity<byte[]> exportLogs(
            @RequestParam(value = "actorId", required = false) UUID actorId,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "targetType", required = false) String targetType,
            @RequestParam(value = "targetId", required = false) String targetId,
            @RequestParam(value = "from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(value = "to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(value = "cursor", defaultValue = "0") int cursor,
            @RequestParam(value = "limit", defaultValue = "1000") int limit
    ) {
        var exported = auditLogQueryService.exportPage(actorId, action, targetType, targetId, from, to, cursor, limit);

        return ResponseEntity.ok()
                .header("X-Next-Cursor", exported.nextCursor() == null ? "" : exported.nextCursor().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"payment-audit-logs.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(exported.csv().getBytes(StandardCharsets.UTF_8));
    }
}
