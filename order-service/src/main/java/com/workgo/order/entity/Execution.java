package com.workgo.order.entity;


import com.workgo.order.enumeration.ExecutionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "executions")
public class Execution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "execution_id")
    UUID executionId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "execution_type")
    ExecutionType executionType;

    @Column(name = "started_at")
    Instant startedAt;

    @Column(name = "delivered_at")
    Instant deliveredAt;

    @Column(name = "completed_at")
    Instant completedAt;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    //==============FK==================

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    Order order;

}
