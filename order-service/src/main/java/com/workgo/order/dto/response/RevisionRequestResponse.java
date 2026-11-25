package com.workgo.order.dto.response;


import com.workgo.order.enumeration.RevisionStatus;
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
public class RevisionRequestResponse {

    UUID revisionRequestId;

    UUID deliveryPackageId;

    UUID requestedBy;

    String reason;

    RevisionStatus status;

    Instant createdAt;

    Instant resolvedAt;
    Integer deliveryVersion;
    Integer agreementVersion;
    java.util.List<String> criterionRefs;
    String scopeSnapshot;
    String criteriaSnapshot;
    Instant requestedAt;
    Instant responseDueAt;
    Instant deadlineAgreementDueAt;
    Instant respondedAt;
    String providerResponse;
    Instant proposedRepairDeadline;
    Instant agreedRepairDeadline;
    Instant deadlineAgreedAt;
    boolean adminSuggested;
    boolean supportRequired;


}
