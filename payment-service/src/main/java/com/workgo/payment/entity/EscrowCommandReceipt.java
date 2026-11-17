package com.workgo.payment.entity;

import com.workgo.payment.enumeration.EscrowTxnType;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** Successful command receipt, committed atomically with the escrow transition. */
@Entity
@Table(name = "escrow_command_receipts", uniqueConstraints = @UniqueConstraint(
        name = "uk_escrow_command", columnNames = {"order_id", "dispute_id", "operation"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EscrowCommandReceipt {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "order_id", nullable = false)
    private UUID orderId;
    @Column(name = "dispute_id", nullable = false)
    private UUID disputeId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private EscrowTxnType operation;
    @Column(name = "reason_code", nullable = false, columnDefinition = "text")
    private String reasonCode;
    @Builder.Default @Column(name = "processed_at", nullable = false)
    private Instant processedAt = Instant.now();
}
