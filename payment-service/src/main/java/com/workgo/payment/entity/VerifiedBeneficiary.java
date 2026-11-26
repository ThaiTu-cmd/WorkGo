package com.workgo.payment.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="verified_beneficiaries") @Getter @Setter @NoArgsConstructor
public class VerifiedBeneficiary {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID userId;
    @Column(nullable=false,updatable=false) private String bankCode;
    @Column(nullable=false,updatable=false) private String accountNumber;
    @Column(nullable=false,updatable=false) private String accountName;
    @Column(nullable=false,updatable=false) private Instant verifiedAt;
    @Column(nullable=false,updatable=false) private Instant expiresAt;
}
