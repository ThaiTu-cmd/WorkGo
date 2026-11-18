package com.workgo.payment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PayoutCreationRequest {

    BigDecimal amount;

    String bankCode;

    String accountNumber;

    String accountName;

}
