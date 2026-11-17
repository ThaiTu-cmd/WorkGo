package com.workgo.order.dto.request;


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
public class WorkEvidenceCreationRequest {

    EvidencePhase phase;

    UUID fileId;

    Double latitude;

    Double longitude;

    Instant capturedAt;

}
