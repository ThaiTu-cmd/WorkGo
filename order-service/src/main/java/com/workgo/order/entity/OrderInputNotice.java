package com.workgo.order.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name="order_input_notices")
public class OrderInputNotice {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID orderId;
    @Column(nullable=false,updatable=false) private UUID recipientId;
    @Column(nullable=false,updatable=false) private String type;
    @Column(nullable=false) private Instant nextAttemptAt;
    private Instant acknowledgedAt;
    private int attempts;
}
