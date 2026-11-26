package com.workgo.order.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Table(name="provider_admissions") @Getter @lombok.Setter @NoArgsConstructor
public class ProviderAdmission {
    @Id private UUID providerId;
    private UUID lastConsumedRecoveryGrantId;
    private UUID reservationGrantId;
    public ProviderAdmission(UUID id){providerId=id;}
}
