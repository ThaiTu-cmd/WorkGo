package com.workgo.order.dto.response;

import com.workgo.order.enumeration.EvidencePhase;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkEvidenceResponse {

    UUID workEvidenceId;

    UUID executionId;

    EvidencePhase phase;

    UUID uploadedBy;

    String fileUrl;

    Double latitude;

    Double longitude;

    Instant capturedAt;

    Instant createdAt;
}
