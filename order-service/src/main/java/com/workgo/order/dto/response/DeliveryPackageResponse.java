package com.workgo.order.dto.response;


import com.workgo.order.enumeration.DeliveryPackageStatus;
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
public class DeliveryPackageResponse {

    UUID deliveryPackageId;

    UUID executionId;

    int versionNo;

    String message;

    DeliveryPackageStatus status;

    Instant deliveredAt;

    Instant createdAt;

    List<DeliveryFileResponse> files;

}
