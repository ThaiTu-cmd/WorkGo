package com.workgo.trust.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ProgressNoticeDto(
        UUID noticeId,
        UUID orderId,
        UUID actorId,
        String actorRole,
        String noticeType,
        Instant occurredAt,
        String summary,
        String evidenceUrl,
        int contactAttemptNo
) {}
