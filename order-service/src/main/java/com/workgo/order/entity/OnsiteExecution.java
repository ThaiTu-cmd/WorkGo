package com.workgo.order.entity;

import com.workgo.order.enumeration.DigitalExecutionStatus;
import com.workgo.order.enumeration.OnsiteExecutionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "onsite_executions")
public class OnsiteExecution {

    @Id
    @Column(name = "execution_id")
    UUID executionId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    OnsiteExecutionStatus status;

    @Column(name = "address_snapshot")
    String addressSnapshot;

    @Column(name = "scheduled_start")
    Instant scheduledStart;

    @Column(name = "scheduled_end")
    Instant scheduledEnd;

    @Column(name = "arrived_at")
    Instant arrivedAt;

    @Column(name = "checkin_code_hash")
    String checkinCodeHash;

    @Column(name = "service_completed_at")
    Instant serviceCompletedAt;


    //============FK===============

    @Column(name = "booking_slot_id")
    UUID bookingSlotId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "execution_id")
    Execution execution;
}