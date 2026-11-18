package com.workgo.order.dto.response.client;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CashFeeResponse {

    UUID feeAssessmentId;

    Long amount;

    Long collectedAmount;

    String status;

}
