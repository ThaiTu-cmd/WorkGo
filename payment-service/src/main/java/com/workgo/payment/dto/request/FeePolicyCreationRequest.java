package com.workgo.payment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeePolicyCreationRequest {

    BigDecimal successFeeRate;

    BigDecimal cancellationFeeRate;

    BigDecimal cancellationFeeCap;

    Instant effectiveFrom;

    String reason;

}
