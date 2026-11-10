package com.workgo.payment.dto.gateway;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

//ket qua IPN da verify, chung cho moi gateway
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GatewayCallbackResult {

    String paymentCode;

    boolean success;

    BigDecimal amount;

    String gatewayTxnId;

    String failureCode;

    String failureMessage;

    String rawResponse;

}
