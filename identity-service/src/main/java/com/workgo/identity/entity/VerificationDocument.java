package com.workgo.identity.entity;

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
@Table(name = "verification_documents")
public class VerificationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "verification_document_id")
    UUID verificationDocumentId;

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

    //====================Relation=============

    @ManyToOne
    @JoinColumn(name = "provider_verification_id", nullable = false)
    ProviderVerification verification;
}
