package com.workgo.catalog.entity;

import com.workgo.catalog.enumeration.PackageStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "packages")
@SQLRestriction("is_deleted = 0")
public class Package {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    UUID packageId;

    @Column(name = "name")
    String name;

    @Column(name = "description")
    String description;

    @Column(name = "price")
    BigDecimal price;

    @Builder.Default
    @Column(name = "currency")
    String currency = "VND";

    @Column(name = "delivery_days")
    Integer deliveryDay;

    @Column(name = "duration_minute")
    Integer durationMinute;

    @Column(name = "revision_limit")
    Integer revisionLimit;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "package_status")
    PackageStatus packageStatus = PackageStatus.ACTIVE;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //===========FK============

    @ManyToOne
    @JoinColumn(name = "service_id")
    Service service;


}
