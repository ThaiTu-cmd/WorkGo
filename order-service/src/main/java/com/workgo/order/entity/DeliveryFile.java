package com.workgo.order.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "delivery_files")
public class DeliveryFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "delivery_file_id")
    UUID deliveryFileId;

    @Column(name = "file_url", columnDefinition = "TEXT")
    String fileUrl;

    @Column(name = "file_name")
    String fileName;

    @Column(name = "mime_type")
    String mimeType;

    @Column(name = "size_bytes")
    Long sizeBytes;

    @Column(name = "file_hash")
    String fileHash;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //============FK===============

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_package_id")
    DeliveryPackage deliveryPackage;

}
