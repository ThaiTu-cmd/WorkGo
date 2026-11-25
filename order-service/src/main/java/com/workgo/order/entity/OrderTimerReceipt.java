package com.workgo.order.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="order_timer_receipts") @Getter @Setter @NoArgsConstructor
public class OrderTimerReceipt {
    @Id private UUID commandId;
    @Column(nullable=false,updatable=false) private UUID orderId;
    @Column(nullable=false,updatable=false) private String sourceKey;
    private boolean requireNewDelivery;
    private Long expectedVersion;
    private long timerVersion;
    private boolean paused;
    private Instant resumeAt;
    private boolean requiresNewDelivery;
}
