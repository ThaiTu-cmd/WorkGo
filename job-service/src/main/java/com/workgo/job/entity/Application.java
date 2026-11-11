package com.workgo.job.entity;

import com.workgo.job.enumeration.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;
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
@Table(name = "applications", uniqueConstraints = {
        @UniqueConstraint(name = "uq_app_job_provider", columnNames = {"job_id", "provider_id"}),
        @UniqueConstraint(name = "uq_app_id_job", columnNames = {"application_id", "job_id"})
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE applications SET is_deleted = true WHERE application_id = ?",
        verify = Expectation.RowCount.class)
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "application_id")
    UUID applicationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_application_job"))
    Job job;

    @Column(name = "provider_id", nullable = false)
    UUID providerId;

    @Column(name = "message", columnDefinition = "TEXT")
    String message;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    ApplicationStatus status = ApplicationStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    Boolean isDeleted = false;
}
