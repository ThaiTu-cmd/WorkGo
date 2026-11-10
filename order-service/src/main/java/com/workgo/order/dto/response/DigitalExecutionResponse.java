package com.workgo.order.dto.response;

import com.workgo.order.enumeration.DigitalExecutionStatus;
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
public class DigitalExecutionResponse {

    UUID executionId;
    Instant requirementSubmittedAt;
    Instant deadlineAt;
    Integer revisionLimit;
    Integer revisionsUsed;
    DigitalExecutionStatus status;
}