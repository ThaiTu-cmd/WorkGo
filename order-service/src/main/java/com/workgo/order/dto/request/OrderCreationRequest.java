package com.workgo.order.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderCreationRequest {

    UUID serviceId;

    UUID packageId;

    List<UUID> addonIds;

    UUID bookingSlotId;

    String address;

}
