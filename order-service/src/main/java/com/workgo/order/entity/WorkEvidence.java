package com.workgo.order.entity;


import com.workgo.order.enumeration.EvidencePhase;
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
@Table(name = "work_evidences")
public class WorkEvidence {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "work_evidence_id")
    UUID workEvidenceId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "phase")
    EvidencePhase phase;

    @Column(name = "uploaded_by")
    UUID uploadedBy;

    @Column(name = "file_url", columnDefinition = "TEXT")
    String fileUrl;

    @Column(name = "latitude")
    Double latitude;

    @Column(name = "longitude")
    Double longitude;

    @Column(name = "captured_at")
    Instant capturedAt;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //==========FK================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id")
    Execution execution;

}
