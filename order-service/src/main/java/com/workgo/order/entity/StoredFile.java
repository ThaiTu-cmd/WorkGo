package com.workgo.order.entity;

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
@Table(name = "stored_files", indexes = {
        @Index(name = "idx_stored_files_order", columnList = "order_id, created_at")
})
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "stored_file_id")
    UUID storedFileId;

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "context", nullable = false)
    String context;

    @Column(name = "uploaded_by", nullable = false)
    UUID uploadedBy;

    @Column(name = "original_name")
    String originalName;

    @Column(name = "mime_type", nullable = false)
    String mimeType;

    @Column(name = "size_bytes", nullable = false)
    Long sizeBytes;

    @Column(name = "sha256", nullable = false)
    String sha256;

    @Column(name = "storage_key", nullable = false)
    String storageKey;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();
}
