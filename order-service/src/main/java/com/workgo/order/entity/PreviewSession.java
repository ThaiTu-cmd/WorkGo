package com.workgo.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** Public preview record. Credentials live separately and never appear in this object. */
@Entity @Table(name="preview_sessions", uniqueConstraints={
    @UniqueConstraint(columnNames={"order_id","active_slot"}),
    @UniqueConstraint(columnNames={"order_id","request_key"})})
@Getter @Setter @NoArgsConstructor
public class PreviewSession {
    @Id private UUID id;
    @Column(name="order_id",nullable=false) private UUID orderId;
    @Column(name="active_slot") private Integer activeSlot=1;
    @Column(name="request_key",nullable=false) private UUID requestKey;
    private UUID requesterId;
    private UUID hostUserId;
    private UUID scheduleProposerId;
    private String submissionId;
    private long version;
    @Version private Long lockVersion;
    private String status="REQUESTED";
    private Instant createdAt;
    private Instant responseDueAt;
    private Instant scheduleDueAt;
    private Instant scheduledAt;
    private boolean pauseActive;
    private UUID attemptId;
    private String roomStatus="NOT_CREATED";
    @Column(unique=true) private String spaceName;
    private String meetingUri;
    private String lastError;
    private Instant closedAt;
}
