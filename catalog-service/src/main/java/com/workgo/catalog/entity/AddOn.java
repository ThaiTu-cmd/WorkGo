package com.workgo.catalog.entity;

import com.workgo.catalog.enumeration.AddOnStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "add_ons")
@SQLRestriction("is_deleted = 0")
public class AddOn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "add_on_id")
    UUID addOnId;

    @Column(name = "name")
    String name;

    @Column(name = "description")
    String description;

    @Column(name = "price")
    BigDecimal price;

    @Builder.Default
    @Column(name = "currency")
    String currency = "VND";

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    AddOnStatus status = AddOnStatus.ACTIVE;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //===============FK==============

    @ManyToOne
    @JoinColumn(name = "service_id")
    Service service;

}
