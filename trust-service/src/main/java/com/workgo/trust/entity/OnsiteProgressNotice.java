package com.workgo.trust.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onsite_progress_notices")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnsiteProgressNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notice_id")
    private UUID noticeId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(name = "actor_role", nullable = false, length = 30)
    private String actorRole;

    @Column(name = "notice_type", nullable = false, length = 60)
    private String noticeType;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Column(name = "evidence_url", columnDefinition = "TEXT")
    private String evidenceUrl;

    @Column(name = "contact_attempt_no", nullable = false)
    private int contactAttemptNo;
}
