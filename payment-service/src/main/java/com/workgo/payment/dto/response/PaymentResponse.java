package com.workgo.payment.dto.response;


import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import com.workgo.payment.enumeration.PaymentPurpose;
import com.workgo.payment.enumeration.PaymentStatus;
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
public class PaymentResponse {

    UUID paymentId;

    String paymentCode;

    UUID orderId;

    UUID payerId;

    PaymentPurpose purpose;

    BigDecimal amount;

    String currency;

    PaymentGateway gateway;

    PaymentMethod paymentMethod;

    PaymentStatus status;

    String paymentUrl;

    String qrCodeUrl;

    String deeplink;

    String failureCode;

    String failureMessage;

    Instant paidAt;

    Instant expiresAt;

    Instant createdAt;

}
