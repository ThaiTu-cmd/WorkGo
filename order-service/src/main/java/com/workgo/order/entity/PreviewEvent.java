package com.workgo.order.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="preview_events") @Getter @Setter @NoArgsConstructor
public class PreviewEvent {
    @Id private UUID id;
    private UUID previewId;
    private UUID actorId;
    private String type;
    @Column(length=2000) private String note;
    private Instant occurredAt;
    private long previewVersion;
}
