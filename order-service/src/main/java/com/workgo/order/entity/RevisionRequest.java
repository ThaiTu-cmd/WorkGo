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


    @Column(name = "delivery_version")
    Integer deliveryVersion;
    @Column(name = "agreement_version")
    Integer agreementVersion;
    @ElementCollection
    @CollectionTable(name = "revision_criterion_refs", joinColumns = @JoinColumn(name = "revision_request_id"))
    @OrderColumn(name = "ref_index")
    @Column(name = "criterion_ref")
    @Builder.Default
    java.util.List<String> criterionRefs = new java.util.ArrayList<>();
    @Column(name = "scope_snapshot", columnDefinition = "TEXT")
    String scopeSnapshot;
    @Column(name = "criteria_snapshot", columnDefinition = "TEXT")
    String criteriaSnapshot;
    @Column(name = "response_due_at")
    Instant responseDueAt;
    @Column(name = "deadline_agreement_due_at")
    Instant deadlineAgreementDueAt;
    @Column(name = "responded_at")
    Instant respondedAt;
    @Column(name = "provider_response", columnDefinition = "TEXT")
    String providerResponse;
    @Column(name = "proposed_repair_deadline")
    Instant proposedRepairDeadline;
    @Column(name = "agreed_repair_deadline")
    Instant agreedRepairDeadline;
    @Column(name = "deadline_agreed_at")
    Instant deadlineAgreedAt;

    //============FK===============

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_package_id")
    DeliveryPackage deliveryPackage;
}
