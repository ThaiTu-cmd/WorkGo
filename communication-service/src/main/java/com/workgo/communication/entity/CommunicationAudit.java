package com.workgo.communication.entity;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.*;

/** Append-only operational metadata. No notification content, identity documents or credentials. */
@Document("communication_admin_audit")
@CompoundIndexes({@CompoundIndex(name="audit_actor_time",def="{'actorId':1,'createdAt':-1,'_id':-1}"),
    @CompoundIndex(name="audit_target_time",def="{'targetId':1,'createdAt':-1,'_id':-1}")})
public record CommunicationAudit(@Id UUID id, UUID actorId, String actorRole, String action,
    String targetType, UUID targetId, String reason, String beforeState, String afterState,
    String correlationId, String source, Instant createdAt) {
    public static CommunicationAudit notification(UUID targetId, Instant at) {
        return new CommunicationAudit(UUID.randomUUID(),new UUID(0,0),"SYSTEM","NOTIFICATION_INGESTED",
            "NOTIFICATION",targetId,"Durable notification ingestion",null,"{\"committed\":true}",
            com.workgo.communication.configuration.CorrelationTrace.current(),"COMMUNICATION",at);
    }
}
