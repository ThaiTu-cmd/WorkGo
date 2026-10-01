package com.workgo.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.ArrayList;
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
@Table(name = "categories", uniqueConstraints = {
        @UniqueConstraint(name = "slug-isDeleted", columnNames = {"slug", "isDeleted"})
})
@SQLRestriction("is_deleted = 0")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "category_id")
    UUID categoryId;

    @Column(name = "name")
    String name;

    @Column(name = "slug", unique = true)
    String slug;

    @Column(name = "description")
    String description;

    @Column(name = "created_at")
    Instant createdAt;

    @Column(name = "created_by")
    UUID createdBy;

    @Column(name = "updated_at")
    Instant updatedAt;

    @Column(name = "updated_by")
    UUID updatedBy;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //========Relation=========

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    Category parent;

    @Builder.Default
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    Set<Category> children = new HashSet<>();

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    Set<Service> services = new HashSet<>();

}
