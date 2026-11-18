package com.workgo.payment.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeePolicyResponse {

    UUID feePolicyVersionId;

    Integer versionNo;

    BigDecimal successFeeRate;

    BigDecimal cancellationFeeRate;

    Long cancellationFeeCap;

    Instant effectiveFrom;

    String reason;

    UUID createdBy;

    Instant createdAt;

}
