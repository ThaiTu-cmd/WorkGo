package com.workgo.catalog.entity;

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
@Entity
@Table(name = "booking_slots")
@SQLRestriction("is_deleted = 0")
public class BookingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_slot_id")
    UUID bookingSlotId;

    @Column(name = "start_at")
    Instant startedAt;

    @Column(name = "end_at")
    Instant endAt;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    BookingStatus status;

    @Column(name = "version")
    String version;

    @Column(name = "hold_expires_at")
    Instant holdExpiresAt;

    @Column(name = "created_at")
    Instant createdAt;

    @Column(name = "updated_at")
    Instant updatedAt;

    //=============FK==================

    @ManyToOne
    @JoinColumn(name = "service_id")
    Service service;

    @Column(name = "order_id")
    UUID orderId;

}
