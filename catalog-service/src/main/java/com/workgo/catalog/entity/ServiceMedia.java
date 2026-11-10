package com.workgo.catalog.entity;

import com.workgo.catalog.enumeration.MediaType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "service_medias")
@SQLRestriction("is_deleted = 0")
public class ServiceMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "service_media_id")
    UUID serviceMediaId;

    @Column(name = "url")
    String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type")
    MediaType mediaType;

    @Column(name = "is_cover")
    boolean cover;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //====================FK====================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    Service service;

}
