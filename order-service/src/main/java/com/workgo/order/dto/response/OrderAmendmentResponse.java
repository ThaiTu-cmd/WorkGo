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
public class OrderAmendmentResponse {

    UUID amendmentId;
    String rewardQuoteRef;
    UUID paymentReceiptId;
    Instant paymentAdjustedAt;

    Integer baseVersionNo;

    UUID proposedBy;

    String proposedByRole;

    String oldScope;
    BigDecimal oldPrice;
    Integer oldDurationDays;
    String newScope;

    BigDecimal newPrice;

    Integer newDurationDays;

    String reason;

    String status;

    UUID respondedBy;

    Instant respondedAt;

    String responseNote;

    Instant createdAt;
}
