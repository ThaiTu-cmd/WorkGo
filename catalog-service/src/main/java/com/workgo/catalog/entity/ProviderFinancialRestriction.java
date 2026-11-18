package com.workgo.catalog.entity;

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
@Table(name = "provider_financial_restrictions")
public class ProviderFinancialRestriction {

    @Id
    @Column(name = "provider_id")
    UUID providerId;

    @Column(name = "is_restricted", nullable = false)
    boolean restricted;

    @Column(name = "version", nullable = false)
    long version;

    @Column(name = "updated_at")
    Instant updatedAt;

}
