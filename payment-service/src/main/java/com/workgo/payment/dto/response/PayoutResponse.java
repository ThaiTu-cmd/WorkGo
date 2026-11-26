package com.workgo.payment.dto.response;

import com.workgo.payment.enumeration.PayoutStatus;
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
public class PayoutResponse {

    UUID payoutId;

    String payoutCode;

    UUID userId;

    Long amount;

    String currency;

    String bankCode;

    String accountNumber;

    String accountName;

    UUID verifiedBeneficiaryId;

    UUID holdTransactionId;

    UUID settleTransactionId;

    PayoutStatus status;

    String externalReference;

    String failureReason;

    Instant processingAt;

    Instant finishedAt;

    Instant createdAt;

}
