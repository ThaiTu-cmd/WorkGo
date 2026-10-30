package com.workgo.order.entity;


import com.workgo.order.enumeration.DeliveryPackageStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Instant;
import java.util.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "delivery_packages", uniqueConstraints = {
        @UniqueConstraint(name = "uk_delivery_version",
                columnNames = {"execution_id", "version_no"})
})
public class DeliveryPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "delivery_package_id")
    UUID deliveryPackageId;

    @Column(name = "version_no")
    int versionNo;

    @Column(name = "message", columnDefinition = "TEXT")
    String message;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    DeliveryPackageStatus status;

    @Column(name = "delivered_at")
    Instant deliveredAt;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //============FK===============

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id")
    Execution execution;

    @Builder.Default
    @OneToMany(mappedBy = "deliveryPackage", cascade = CascadeType.ALL)
    List<DeliveryFile> files = new ArrayList<>();

}
