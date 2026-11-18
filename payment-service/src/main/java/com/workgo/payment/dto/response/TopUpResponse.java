package com.workgo.payment.dto.response;


import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import com.workgo.payment.enumeration.TopUpStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopUpResponse {

    UUID topUpId;

    String topUpCode;

    Long amount;

    String currency;

    PaymentGateway gateway;

    PaymentMethod paymentMethod;

    TopUpStatus status;

    String paymentUrl;

    String qrCodeUrl;

    String deeplink;

    String failureCode;

    String failureMessage;

    Instant expiresAt;

    Instant confirmedAt;

    Instant createdAt;

}
