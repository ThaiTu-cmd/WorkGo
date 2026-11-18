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
public class EscrowAdjustRequest {

    UUID orderId;

    UUID amendmentId;

    BigDecimal newTotalAmount;

    BigDecimal newPlatformFee;

}
