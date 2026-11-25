package com.workgo.trust.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "private_evidence")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PrivateEvidence {
    @Id
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID disputeId;

    @Column(nullable = false, updatable = false)
    private UUID uploaderId;

    @Column(nullable = false, updatable = false)
    private String mimeType;

    @Column(nullable = false, updatable = false)
    private long sizeBytes;

    @Column(nullable = false, updatable = false, length = 64)
    private String checksum;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "storage_key")
    private String storageKey;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "status", length = 32)
    private String status = "READY";

    @Column(name = "evidence_hold")
    private boolean evidenceHold = true;

    @Column(name = "retention_until")
    private Instant retentionUntil;

    public PrivateEvidence(UUID id, UUID dispute, UUID user, String mime, long size, String sha) {
        this(id, dispute, user, mime, size, sha, id == null ? null : id.toString(), "evidence", "READY", true,
                Instant.now().plus(Duration.ofDays(90)));
    }

    public PrivateEvidence(UUID id, UUID dispute, UUID user, String mime, long size, String sha,
                           String storageKey, String originalName, String status, boolean evidenceHold, Instant retentionUntil) {
        this.id = id;
        this.disputeId = dispute;
        this.uploaderId = user;
        this.mimeType = mime;
        this.sizeBytes = size;
        this.checksum = sha;
        this.createdAt = Instant.now();
        this.storageKey = storageKey == null || storageKey.isBlank() ? (id == null ? null : id.toString()) : storageKey;
        this.originalName = originalName == null || originalName.isBlank() ? "evidence" : originalName;
        this.status = status == null || status.isBlank() ? "READY" : status;
        this.evidenceHold = evidenceHold;
        this.retentionUntil = retentionUntil == null ? this.createdAt.plus(Duration.ofDays(90)) : retentionUntil;
    }

    @JsonProperty("mime")
    public String getMime() {
        return mimeType;
    }

    @JsonProperty("size")
    public long getSize() {
        return sizeBytes;
    }

    @JsonProperty("sha256")
    public String getSha256() {
        return checksum;
    }

    public String getEffectiveStorageKey() {
        return storageKey == null || storageKey.isBlank() ? id.toString() : storageKey;
    }
}
