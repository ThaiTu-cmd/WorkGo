package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.RuleStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableRuleUpdateRequest {

    RuleStatus status;

    int slotDurationMinute;

    Instant endTime;

    Instant startTime;

    int dayOfWeek;


}
