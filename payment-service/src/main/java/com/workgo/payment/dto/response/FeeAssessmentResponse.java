package com.workgo.payment.dto.response;

import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.FeeType;
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
public class FeeAssessmentResponse {

    UUID feeAssessmentId;

    UUID orderId;

    FeeType feeType;

    FeeChargedParty chargedParty;

    UUID chargedUserId;

    UUID feePolicyVersionId;

    Long baseAmount;

    Long amount;

    Long collectedAmount;

    Long outstandingAmount;

    FeeAssessmentStatus status;

    UUID decisionId;

    Instant createdAt;

    Instant updatedAt;

}
