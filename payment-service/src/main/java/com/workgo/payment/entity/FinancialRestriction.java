package com.workgo.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "financial_restrictions")
public class FinancialRestriction {

    @Id
    @Column(name = "user_id")
    UUID userId;

    @Column(name = "provider_id")
    UUID providerId;

    @Column(name = "is_restricted", nullable = false)
    boolean restricted;

    @Builder.Default
    @Column(name = "version", nullable = false)
    long version = 0;

    @Builder.Default
    @Column(name = "identity_synced_version", nullable = false)
    long identitySyncedVersion = 0;

    @Builder.Default
    @Column(name = "catalog_synced_version", nullable = false)
    long catalogSyncedVersion = 0;

    @Column(name = "updated_at")
    Instant updatedAt;

    @Column(name = "synced_at")
    Instant syncedAt;

}
