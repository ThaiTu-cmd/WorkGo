package com.workgo.job.entity;

import com.workgo.job.enumeration.ExecutionType;
import com.workgo.job.enumeration.JobStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.jdbc.Expectation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "jobs")
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE jobs SET is_deleted = true, version = version + 1 WHERE job_id = ? AND version = ?",
        verify = Expectation.RowCount.class)
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_id")
    UUID jobId;

    @Column(name = "client_id", nullable = false)
    UUID clientId;

    @Column(name = "category_id", nullable = false)
    UUID categoryId;

    @Column(name = "title", nullable = false, length = 255)
    String title;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "budget_min", precision = 19, scale = 2)
    BigDecimal budgetMin;

    @Column(name = "budget_max", precision = 19, scale = 2)
    BigDecimal budgetMax;

    @Builder.Default
    @Column(name = "currency", nullable = false, length = 10)
    String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_type", nullable = false)
    ExecutionType executionType;

    @Column(name = "location_snapshot", columnDefinition = "TEXT")
    String locationSnapshot;

    @Column(name = "deadline_at")
    Instant deadlineAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    JobStatus status = JobStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    Boolean isDeleted = false;

    @Version
    @Column(name = "version", nullable = false)
    Long version;

    @Builder.Default
    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    Set<JobAttachment> attachments = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    Set<Application> applications = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    Set<Proposal> proposals = new HashSet<>();
}
