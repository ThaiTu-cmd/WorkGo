package com.workgo.identity.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;import java.time.Instant;
@Entity @Table(name="security_support_requests") @Getter @Setter @NoArgsConstructor
public class SecuritySupportRequest {
 @Id @GeneratedValue(strategy=GenerationType.UUID)private UUID id;
 @Column(nullable=false,updatable=false,length=254)private String contact;
 @Column(nullable=false,updatable=false,length=2000)private String description;
 @Column(nullable=false,updatable=false)private Instant createdAt=Instant.now();
 @Column(nullable=false)private String status="OPEN";
 @Version private Long version;
}
