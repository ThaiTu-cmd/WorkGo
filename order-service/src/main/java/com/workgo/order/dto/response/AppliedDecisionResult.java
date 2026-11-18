package com.workgo.order.dto.response;

import com.workgo.order.enumeration.DecisionOperation;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
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
public class AppliedDecisionResult {

    UUID decisionId;

    UUID orderId;

    UUID disputeId;

    DecisionOperation operation;

    OrderStatus orderStatus;

    PaymentStatus paymentStatus;

    UUID settlementReceiptId;

    Instant appliedAt;

    boolean replayed;

}
