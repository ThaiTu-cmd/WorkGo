package com.workgo.catalog.dto.response;

import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.RuleStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableRuleResponse {

    UUID availableRuleId;

    RuleStatus status;

    int slotDurationMinute;

    Instant endTime;

    Instant startTime;

    int dayOfWeek;

    Instant createdAt;

    UUID serviceId;

}
