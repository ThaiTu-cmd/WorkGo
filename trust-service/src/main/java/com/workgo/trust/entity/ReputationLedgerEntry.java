package com.workgo.trust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reputation_ledger",uniqueConstraints=@UniqueConstraint(columnNames={"provider_id","source_key"}))
@Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class ReputationLedgerEntry {
    @Id private UUID id;
    @Column(name="provider_id",nullable=false,updatable=false) private UUID providerId;
    @Column(name="order_id",updatable=false) private UUID orderId;
    @Column(name="decision_id",updatable=false) private UUID decisionId;
    @Column(name="source_key",nullable=false,updatable=false) private String sourceKey;
    @Column(nullable=false,updatable=false) private String kind;
    @Column(name="requested_delta",nullable=false,updatable=false) private int requestedDelta;
    @Column(name="applied_delta",nullable=false,updatable=false) private int appliedDelta;
    @Column(nullable=false,updatable=false) private int beforeScore;
    @Column(nullable=false,updatable=false) private int afterScore;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(nullable=false,updatable=false,length=64) private String payloadHash;
    @Column(nullable=false,updatable=false) private String policyVersion;
    @Column(nullable=false,updatable=false) private Instant createdAt;
    private UUID referenceEntryId;
    @Column(updatable=false) private UUID clientId;
    public void assignRewardClient(UUID client) {
        if (!"REWARD".equals(kind) || clientId != null) throw new IllegalStateException("Reward client is immutable");
        clientId=client;
    }
    public ReputationLedgerEntry(UUID provider,UUID order,UUID decision,String source,String kind,int requested,int before,int after,String reason,String hash,UUID reference) {
        id=UUID.randomUUID();providerId=provider;orderId=order;decisionId=decision;sourceKey=source;this.kind=kind;
        requestedDelta=requested;beforeScore=before;afterScore=after;appliedDelta=after-before;this.reason=reason;payloadHash=hash;
        policyVersion="WG-POLICY-1.0";createdAt=Instant.now();referenceEntryId=reference;
    }
}
