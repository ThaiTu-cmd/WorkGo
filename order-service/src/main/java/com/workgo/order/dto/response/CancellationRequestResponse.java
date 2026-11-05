package com.workgo.order.dto.response;


import com.workgo.order.enumeration.CancellationStatus;
import com.workgo.order.enumeration.RoleName;
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
public class CancellationRequestResponse {

    UUID cancellationRequestId;

    UUID orderId;

    UUID requestedBy;

    RoleName requestedByRole;

    String reasonCode;

    String note;

    Integer refundPercent;

    CancellationStatus status;

    UUID respondedBy;

    Instant respondedAt;

    Instant createdAt;

}
