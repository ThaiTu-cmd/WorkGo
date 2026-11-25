package com.workgo.payment.dto.gateway;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GatewayCallbackResult {

    boolean verified;

    String currency;

    String merchant;

    String paymentCode;

    boolean success;

    BigDecimal amount;

    String gatewayTxnId;

    String failureCode;

    String failureMessage;

    String rawResponse;

}
