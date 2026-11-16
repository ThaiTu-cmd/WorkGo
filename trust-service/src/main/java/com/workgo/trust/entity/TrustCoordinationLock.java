package com.workgo.trust.entity;

import jakarta.persistence.*;
import lombok.*;

/** Durable lock namespace, also owning the monotonic rating snapshot sequence. */
@Entity
@Table(name = "trust_coordination_locks")
@Getter @Setter @NoArgsConstructor
public class TrustCoordinationLock {
    @Id @Column(name = "lock_key", length = 200)
    private String lockKey;
    @Column(name = "sequence_value", nullable = false)
    private long sequenceValue;
    public TrustCoordinationLock(String key) { this.lockKey = key; }
}
