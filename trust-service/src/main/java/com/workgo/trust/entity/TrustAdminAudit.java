package com.workgo.trust.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="trust_admin_audit") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
@org.hibernate.annotations.Immutable
public class TrustAdminAudit {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID actorId;
    @Column(nullable=false,updatable=false) private UUID targetId;
    @Column(nullable=false,updatable=false) private String action;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(updatable=false) private String beforeState;
    @Column(updatable=false) private String afterState;
    @Column(nullable=false,updatable=false) private Instant createdAt;
    @Column(updatable=false) private String actorRole;
    @Column(updatable=false) private String correlationId;
    @Column(updatable=false) private String source;
    @Column(updatable=false) private String targetType;
    public TrustAdminAudit(UUID actor,UUID target,String action,String reason,String before,String after) {
        id=UUID.randomUUID();actorId=actor;targetId=target;this.action=action;this.reason=reason;
        beforeState=before;afterState=after;createdAt=Instant.now();
        actorRole=com.workgo.trust.service.AuditContext.actorRole();
        correlationId=com.workgo.trust.service.AuditContext.correlationId(); source="TRUST";
        targetType=action.startsWith("REVIEW_") ? "REVIEW" : action.startsWith("REPORT_") ? "REPORT" : "DISPUTE";
    }
    public static TrustAdminAudit exported(UUID actor, String state) {
        var log = new TrustAdminAudit(actor, UUID.randomUUID(), "AUDIT_EXPORTED", "Audit export", null, null);
        log.action="AUDIT_EXPORTED"; log.targetType="AUDIT_LOG"; log.beforeState=null; log.afterState=state;
        return log;
    }
    public static TrustAdminAudit system(UUID target, String action, String reason, String before, String after) {
        var log = new TrustAdminAudit();
        log.id = UUID.randomUUID();
        log.actorId = new UUID(0L, 0L);
        log.targetId = target;
        log.action = action;
        log.reason = reason;
        log.beforeState = before;
        log.afterState = after;
        log.createdAt = Instant.now();
        log.actorRole = "SYSTEM";
        log.correlationId = com.workgo.trust.service.AuditContext.correlationId();
        log.source = "TRUST";
        log.targetType = action.startsWith("REVIEW_") ? "REVIEW" : action.startsWith("REPORT_") ? "REPORT" : "DISPUTE";
        return log;
    }
}
