package com.workgo.order.dto.response;

import com.workgo.order.dto.snapshot.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderSnapshotResponse {

    ServiceSnapshot serviceSnapshot;

    PackageSnapshot packageSnapshot;

    List<AddOnSnapshot> addOnSnapshot;

    PricingSnapshot pricingSnapshot;

    ProviderSnapshot providerSnapshot;

    Map<String, Object> requirementValues;

    ExecutionSnapshot executionSnapshot;

    Instant createdAt;

}
