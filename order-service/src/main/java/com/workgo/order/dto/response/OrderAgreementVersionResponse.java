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

    BigDecimal price;

    String currency;

    Integer durationDays;

    Instant scheduleStart;

    Instant scheduleEnd;

    UUID amendmentId;

    Instant providerConfirmedAt;

    Instant clientConfirmedAt;

    Instant createdAt;
}
