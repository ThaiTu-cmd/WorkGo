package com.workgo.order.entity;

import com.workgo.order.enumeration.DigitalExecutionStatus;
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
@Table(name = "digital_executions")
public class DigitalExecution {

    @Id
    @Column(name = "execution_id")
    UUID executionId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    DigitalExecutionStatus status;

    @Column(name = "requirement_submitted_at")
    Instant requirementSubmittedAt;

    @Column(name = "deadline_at")
    Instant deadlineAt;

    @Column(name = "revision_limit")
    Integer revisionLimit;

    @Builder.Default
    @Column(name = "revisions_used")
    int revisionsUsed = 0;

    //============FK===============

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "execution_id")
    Execution execution;
}