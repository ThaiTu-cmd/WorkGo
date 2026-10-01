package com.workgo.identity.entity;

import com.workgo.identity.enumeration.ProviderType;
import com.workgo.identity.enumeration.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "provider_profiles")
@SQLRestriction("is_deleted = 0")
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "provider_profile_id")
    UUID providerProfileId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "provider_type")
    ProviderType providerType;

    @Column(name = "business_name")
    String businessName;

    @Column(name = "bio")
    String bio;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "verification_status")
    VerificationStatus verificationStatus;

    @Builder.Default
    @Column(name = "rating_avg")
    double ratingAvg = 0.0;

    @Builder.Default
    @Column(name = "rating_count")
    long ratingCount = 0;

    @Column(name = "completed_order_count")
    int completedOrderCount;

    @Column(name = "is_accepting_orders")
    boolean isAcceptingOrders;

    @Builder.Default
    @Column(name = "joined_at")
    Instant joinedAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //===FK===
    @OneToOne
    @JoinColumn(name = "user_id")
    User user;

    @Builder.Default
    @OneToMany(mappedBy = "providerProfile",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL)
    Set<ProviderVerification> providerVerificationSet = new HashSet<>();

}
