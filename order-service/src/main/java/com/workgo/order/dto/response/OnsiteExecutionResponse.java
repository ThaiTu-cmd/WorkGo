package com.workgo.order.dto.response;

import com.workgo.order.enumeration.OnsiteExecutionStatus;
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
public class OnsiteExecutionResponse {

    UUID executionId;
    String addressSnapshot;
    Instant scheduledStart;
    Instant scheduledEnd;
    Instant arrivedAt;
    Instant serviceCompletedAt;
    OnsiteExecutionStatus status;
    UUID bookingSlotId;


}