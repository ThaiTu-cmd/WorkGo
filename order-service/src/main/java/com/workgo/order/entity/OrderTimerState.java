package com.workgo.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.*;

/** Order row lock serializes timer, delivery, acceptance and dispute commands. */
@Entity @Table(name="order_timer_states") @Getter @Setter @NoArgsConstructor
public class OrderTimerState {
    @Id private UUID orderId;
    @Column(nullable=false) private String policyVersion="ACCEPTANCE_V1";
    private long timerVersion;
    @Version private Long lockVersion;
    private String submissionId;
    private Instant startedAt;
    private Instant dueAt;
    private long remainingSeconds;
    private Instant pausedAt;
    private long totalPausedSeconds;
    private boolean requiresNewDelivery;
    private boolean extensionUsed;
    private Instant notificationAckAt;
    private Instant acceptedAt;
    @ElementCollection @CollectionTable(name="order_timer_pauses",joinColumns=@JoinColumn(name="order_id"))
    @MapKeyColumn(name="source_key") @Column(name="paused_at")
    private Map<String,Instant> pauses=new HashMap<>();
    // Tombstones prevent a delayed pause from reopening a resolved source.
    @ElementCollection @CollectionTable(name="order_timer_released",joinColumns=@JoinColumn(name="order_id"))
    @Column(name="source_key") private Set<String> released=new HashSet<>();
    @ElementCollection @CollectionTable(name="order_timer_pause_durations",joinColumns=@JoinColumn(name="order_id"))
    @MapKeyColumn(name="source_key") @Column(name="elapsed_seconds")
    private Map<String,Long> pauseDurations=new HashMap<>();
}
