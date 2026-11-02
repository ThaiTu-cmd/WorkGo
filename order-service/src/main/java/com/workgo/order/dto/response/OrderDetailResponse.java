package com.workgo.order.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderDetailResponse {

    OrderResponse order;

    List<OrderItemResponse> items;

    OrderSnapshotResponse snapshot;

    ExecutionResponse execution;

}
