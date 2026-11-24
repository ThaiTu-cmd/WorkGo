package com.workgo.trust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="private_evidence") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class PrivateEvidence {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID disputeId;
    @Column(nullable=false,updatable=false) private UUID uploaderId;
    @Column(nullable=false,updatable=false) private String mimeType;
    @Column(nullable=false,updatable=false) private long sizeBytes;
    @Column(nullable=false,updatable=false,length=64) private String checksum;
    @Column(nullable=false,updatable=false) private Instant createdAt;
    public PrivateEvidence(UUID id,UUID dispute,UUID user,String mime,long size,String sha){
        this.id=id;disputeId=dispute;uploaderId=user;mimeType=mime;sizeBytes=size;checksum=sha;createdAt=Instant.now();
    }
}
