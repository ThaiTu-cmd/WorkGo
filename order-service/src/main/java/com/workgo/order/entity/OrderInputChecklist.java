package com.workgo.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name="order_input_checklists", uniqueConstraints=@UniqueConstraint(columnNames={"order_id","checklist_version"}))
public class OrderInputChecklist {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(name="order_id", nullable=false) private UUID orderId;
    @Column(name="checklist_version", nullable=false) private Integer checklistVersion;
    @Column(nullable=false) private Integer agreementVersion;
    // Immutable after proposal. Empty JSON list explicitly means no inputs required.
    @Column(nullable=false, columnDefinition="text", updatable=false) private String requirements;
    @Column(nullable=false) private Instant providerConfirmedAt;
    private Instant clientConfirmedAt;
    private Long confirmationBaseVersion;
    @Column(columnDefinition="text") private String submittedValues;
    private Instant submittedAt;
    private Instant responseDueAt;
    private Instant acceptedAt;
    @Column(columnDefinition="text") private String missingReason;
    @Column(name="reminder_24_at") private Instant reminder24At;
    @Column(name="reminder_72_at") private Instant reminder72At;
    private Instant escalatedAt;
    @Column(nullable=false) private Instant createdAt;
    @Version private Long version;
}
