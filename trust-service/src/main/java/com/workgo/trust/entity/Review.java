package com.workgo.trust.entity;

import com.workgo.trust.enumeration.ModerationStatus;
import com.workgo.trust.enumeration.ReviewDirection;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews",
        uniqueConstraints = @UniqueConstraint(name = "uq_review_order_direction", columnNames = {"order_id", "direction"}),
        indexes = {
            @Index(name = "idx_review_order", columnList = "order_id"),
            @Index(name = "idx_review_reviewee_published", columnList = "reviewee_id, direction, is_published, moderation_status, created_at"),
            @Index(name = "idx_review_service_published", columnList = "service_id, direction, is_published, moderation_status, created_at"),
            @Index(name = "idx_review_reviewer", columnList = "reviewer_id, created_at"),
            @Index(name = "idx_review_due_publish", columnList = "is_published, publish_eligible_at")
        })
@Check(name = "ck_review_rating_range", constraints = "rating >= 1 AND rating <= 5")
@SQLRestriction("is_deleted = false")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "review_id")
    private UUID reviewId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "service_id")
    private UUID serviceId;

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    @Column(name = "reviewee_id", nullable = false)
    private UUID revieweeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false)
    private ReviewDirection direction;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", nullable = false)
    @Builder.Default
    private ModerationStatus moderationStatus = ModerationStatus.APPROVED;

    @Column(name = "publish_eligible_at", nullable = false)
    private Instant publishEligibleAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
