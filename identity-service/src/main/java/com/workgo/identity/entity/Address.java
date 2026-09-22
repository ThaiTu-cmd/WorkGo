package com.workgo.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "addresses")
@SQLRestriction("is_deleted = 0")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "address_id")
    UUID addressId;

    @Column(name = "label")
    String label;

    @Column(name = "contact_name")
    String contactName;

    @Column(name = "contact_phone")
    String contactPhone;

    @Column(name = "line1")
    String line1;

    @Column(name = "ward")
    String ward;

    @Column(name = "district")
    String district;

    @Column(name = "city")
    String city;

    @Column(name = "country_code")
    String countryCode;

    @Column(name = "latitude")
    String latitude;

    @Column(name = "longitude")
    String longitude;

    @Column(name = "note")
    String note;

    @Column(name = "is_default")
    boolean isDefault;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "is_deleted")
    private int isDeleted = 0;

    //===FK===

    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;

}
