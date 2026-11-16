package com.workgo.trust.dto.request;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.ReportTargetType;

public record DisputeCancelReq(
        @Size(max = 1000, message = "INVALID_REQUEST") String note) {
}
