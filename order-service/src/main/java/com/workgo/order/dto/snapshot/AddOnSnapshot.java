package com.workgo.order.dto.snapshot;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class AddOnSnapshot {

    UUID addOnId;

    String name;

    String description;

    BigDecimal price;

}
