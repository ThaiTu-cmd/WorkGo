package com.workgo.order.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="order_timer_notices") @Getter @Setter @NoArgsConstructor
public class OrderTimerNotice {
    @Id private UUID id;
    @Column(nullable=false) private UUID orderId;
    @Column(nullable=false) private UUID recipientId;
    @Column(nullable=false) private String submissionId;
    @Column(nullable=false) private String type;
    private Instant acknowledgedAt;
    @Column(nullable=false) private Instant nextAttemptAt;
    private int attempts;
    private boolean obsolete;
    private Instant deadlineAt;
}
