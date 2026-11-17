package com.workgo.trust.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.*;

public record ReportDto(
        UUID reportId,
        UUID reporterId,
        ReportTargetType targetType,
        UUID targetId,
        String reason,
        String description,
        String evidenceUrl,
        ReportStatus status,
        Instant createdAt,
        Instant resolvedAt) {
}
