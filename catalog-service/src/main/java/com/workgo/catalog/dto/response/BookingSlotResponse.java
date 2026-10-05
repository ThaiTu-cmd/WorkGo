package com.workgo.catalog.dto.response;

import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingSlotResponse {

    UUID bookingSlotId;

    Instant startedAt;

    Instant startAt;

    Instant endAt;

    BookingStatus status;

    String version;

    Instant holdExpiresAt;

    Instant createdAt;

    Instant updatedAt;

    UUID serviceId;

    UUID orderId;

}
