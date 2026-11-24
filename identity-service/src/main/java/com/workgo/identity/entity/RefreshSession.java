package com.workgo.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** One row per issued refresh credential; never store the credential itself. */
@Entity
@Table(name = "refresh_sessions", indexes = {
        @Index(name = "ix_refresh_family", columnList = "family_id"),
        @Index(name = "ix_refresh_user", columnList = "user_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RefreshSession {
    @Id @Column(name = "token_hash", length = 64) private String tokenHash;
    @Column(name = "family_id", nullable = false) private UUID familyId;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "auth_time", nullable = false) private Long authTime;
    @Column(name = "auth_version", nullable = false) private Long authVersion;
    @Column(name = "revoked", nullable = false) private boolean revoked;
    @Column(name = "rotated_to", length = 64) private String rotatedTo;
}
