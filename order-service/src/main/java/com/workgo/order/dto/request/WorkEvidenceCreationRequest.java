package com.workgo.order.dto.request;


import com.workgo.order.enumeration.EvidencePhase;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkEvidenceCreationRequest {

    EvidencePhase phase;

    String fileUrl;

    Double latitude;

    Double longitude;

    Instant capturedAt;

}
