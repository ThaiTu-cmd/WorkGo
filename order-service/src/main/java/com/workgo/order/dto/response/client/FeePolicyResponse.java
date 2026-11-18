package com.workgo.order.dto.response.client;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
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

}
