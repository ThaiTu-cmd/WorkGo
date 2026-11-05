package com.workgo.order.dto.response.client;

import com.workgo.order.enumeration.client.BookingStatus;
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
public class BookingSlotResponse {

    UUID bookingSlotId;

    Instant startedAt;

    Instant endAt;

    BookingStatus status;

    Instant holdExpiresAt;

    UUID service;

    UUID order;

}
