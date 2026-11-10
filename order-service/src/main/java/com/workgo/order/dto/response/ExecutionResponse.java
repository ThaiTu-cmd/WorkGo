package com.workgo.order.dto.response;

import com.workgo.order.enumeration.ExecutionType;
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
public class ExecutionResponse {

    UUID executionId;
    UUID orderId;
    ExecutionType executionType;

    Instant startedAt;
    Instant deliveredAt;
    Instant completedAt;
    Instant createdAt;
    Instant updatedAt;

    DigitalExecutionResponse digital;
    OnsiteExecutionResponse onsite;
}