package com.workgo.job.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.jdbc.Expectation;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "job_attachments")
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE job_attachments SET is_deleted = true WHERE attachment_id = ?",
        verify = Expectation.RowCount.class)
public class JobAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "attachment_id")
    UUID attachmentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_attachment_job"))
    Job job;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    String fileUrl;

    @Column(name = "file_name")
    String fileName;

    @Column(name = "mime_type")
    String mimeType;

    @Column(name = "size_bytes")
    Long sizeBytes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    Boolean isDeleted = false;
}
