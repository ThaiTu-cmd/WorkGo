package com.workgo.job.dto.response;

import java.util.UUID;

/** Public profile projection supplied by the service; no email, phone or account status. */
public record ClientBasicDto(UUID userId, String displayName, String avatarUrl) {
}
