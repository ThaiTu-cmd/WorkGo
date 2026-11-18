package com.workgo.payment.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReconciliationCase {

    String caseType;

    UUID referenceId;

    String code;

    UUID userId;

    UUID orderId;

    Long amount;

    String status;

    List<String> committedSteps;

    String pendingStep;

    UUID ledgerTransactionId;

    Instant since;

}
