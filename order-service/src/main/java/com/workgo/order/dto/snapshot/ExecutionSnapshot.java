package com.workgo.order.dto.snapshot;

import com.workgo.order.enumeration.ExecutionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class ExecutionSnapshot {

    ExecutionType executionType;

    String address; //ONSITE

    Instant scheduleStart; //ONSITE
    Instant scheduleEnd;

    Integer autoCompleteHours; //DIGITAL

}
