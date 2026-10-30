package com.workgo.order.entity;


import com.workgo.order.enumeration.RevisionStatus;
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
@Table(name = "revision_requests")
public class RevisionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "revision_request_id")
    UUID revisionRequestId;

    @Column(name = "requested_by")
    UUID requestedBy;

    @Column(name = "reason", columnDefinition = "TEXT")
    String reason;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    RevisionStatus status;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "resolved_at")
    Instant resolvedAt;

    //============FK===============

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_package_id")
    DeliveryPackage deliveryPackage;
}