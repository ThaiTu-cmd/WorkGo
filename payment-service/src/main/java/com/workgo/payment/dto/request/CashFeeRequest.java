package com.workgo.payment.dto.request;

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
public class CashFeeRequest {

    UUID orderId;

    UUID providerId;

    BigDecimal orderAmount;

    BigDecimal fee;

    UUID feePolicyVersionId;

    UUID outcomeId;
    Boolean workAccepted;
    Boolean paymentReceived;
    BigDecimal actualReceivedAmount;

}
