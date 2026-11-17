package com.workgo.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "admin_action_logs", indexes = {
        @Index(name = "idx_admin_action_logs_target", columnList = "target_type, target_id, created_at"),
        @Index(name = "idx_admin_action_logs_actor", columnList = "actor_id, created_at")
})
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "admin_action_log_id")
    UUID adminActionLogId;

    @Column(name = "actor_id", nullable = false)
    UUID actorId;

    @Column(name = "actor_role", nullable = false)
    String actorRole;

    @Column(name = "action", nullable = false)
    String action;

    @Column(name = "target_type", nullable = false)
    String targetType;

    @Column(name = "target_id", nullable = false)
    String targetId;

    @Column(name = "reason", columnDefinition = "TEXT")
    String reason;

    @Column(name = "before_state", columnDefinition = "TEXT")
    String beforeState;

    @Column(name = "after_state", columnDefinition = "TEXT")
    String afterState;

    @Column(name = "correlation_id")
    String correlationId;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();
}
