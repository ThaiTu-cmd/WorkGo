package com.workgo.order.entity;


import com.workgo.order.enumeration.CancellationStatus;
import com.workgo.order.enumeration.RoleName;
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
@Table(name = "cancellation_requests")
public class CancellationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "cancellation_request_id")
    UUID cancellationRequestId;

    @Column(name = "requested_by")
    UUID requestedBy;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "requested_by_role")
    RoleName requestedByRole;

    @Column(name = "reason_code")
    String reasonCode;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @Column(name = "refund_percent")
    Integer refundPercent;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    CancellationStatus status;

    @Column(name = "responded_by")
    UUID respondedBy;

    @Column(name = "responded_at")
    Instant respondedAt;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //============FK===============

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", unique = true)
    Order order;
}
