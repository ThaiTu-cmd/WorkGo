package com.workgo.catalog.entity;

import com.workgo.catalog.enumeration.ExecutionType;
import com.workgo.catalog.enumeration.ServiceStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "services", uniqueConstraints = {
        @UniqueConstraint(name = "slug-isDeleted", columnNames = {"slug", "is_deleted"})
})
@SQLRestriction("is_deleted = 0")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "service_id")
    UUID serviceId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "execution_type", nullable = false)
    ExecutionType executionType;

    @Column(name = "title", nullable = false)
    String title;

    @Column(name = "slug", nullable = false, unique = true)
    String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "base_price", nullable = false)
    BigDecimal basePrice;

    @Builder.Default
    @Column(name = "currency", nullable = false, length = 10)
    String currency = "VND";

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    ServiceStatus status = ServiceStatus.DRAFT;

    @Builder.Default
    @Column(name = "avg_rating")
    double avgRating = 0.0;

    @Builder.Default
    @Column(name = "review_count")
    long reviewCount = 0;

    @Builder.Default
    @Column(name = "order_count")
    long orderCount = 0;

    @Column(name = "published_at")
    Instant publishedAt;

    @Column(name = "created_at")
    Instant createdAt;

    @Column(name = "updated_at")
    Instant updatedAt;

    @Column(name = "provider_id", nullable = false)
    UUID providerId;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //============Relation===========
    @ManyToOne
    @JoinColumn(name = "category_id")
    Category category;

    @OneToMany(mappedBy = "service")
    Set<BookingSlot> bookingSlot = new HashSet<>();

    @OneToMany(mappedBy = "service")
    Set<Package> packages = new HashSet<>();

    @OneToMany(mappedBy = "service")
    Set<ServiceMedia> serviceMedia = new HashSet<>();

}
