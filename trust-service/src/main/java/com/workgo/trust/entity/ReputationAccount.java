package com.workgo.trust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Table(name="reputation_accounts") @Getter @Setter @NoArgsConstructor
public class ReputationAccount {
    @Id @Column(name="provider_id") private UUID providerId;
    @Column(nullable=false) private int score;
    @Version private Long version;
    public ReputationAccount(UUID id){providerId=id;}
}
