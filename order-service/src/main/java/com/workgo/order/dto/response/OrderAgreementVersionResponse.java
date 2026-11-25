package com.workgo.order.dto.response;

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
public class OrderAgreementVersionResponse {

    UUID agreementVersionId;

    Integer versionNo;

    String source;

    String scope;

    String acceptanceCriteria;

    String inputRequirements;
    com.workgo.order.enumeration.OrderPaymentMethod paymentMethod;
    UUID feePolicyVersionId;
    String rewardQuoteRef;
    String policyVersion;
    BigDecimal price;

    String currency;

    Integer durationDays;

    String address;
    Instant scheduleStart;

    Instant scheduleEnd;

    UUID amendmentId;

    Instant providerConfirmedAt;

    Instant clientConfirmedAt;

    Instant createdAt;
}
