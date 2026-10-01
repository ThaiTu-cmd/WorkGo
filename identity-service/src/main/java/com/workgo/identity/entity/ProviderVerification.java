package com.workgo.identity.entity;

import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.enumeration.VerificationType;
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
@Table(name = "provider_verification")
public class ProviderVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "provider_verification_id")
    UUID providerVerificationId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "verification_type")
    VerificationType verificationType;

    @Column(name = "document_type")
    String documentType;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "verification_status")
    VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "submitted_at")
    Instant submittedAt;

    @Column(name = "verified_at")
    Instant verifiedAt;

    @Column(name = "verified_by")
    UUID verifiedBy;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //====================Relation=============

    @ManyToOne()
    @JoinColumn(name = "providerProfileId")
    ProviderProfile providerProfile;

}
