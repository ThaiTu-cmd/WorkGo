package com.workgo.order.entity;

import com.workgo.order.dto.snapshot.*;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "order_snapshots")
public class OrderSnapshot {

    @Id
    @Column(name = "order_id")
    UUID orderId;

    @Type(JsonType.class)
    @Column(name = "service_snapshot", columnDefinition = "jsonb")
    ServiceSnapshot serviceSnapshot;

    @Type(JsonType.class)
    @Column(name = "package_snapshot", columnDefinition = "jsonb")
    PackageSnapshot packageSnapshot;

    @Type(JsonType.class)
    @Column(name = "add_on_snapshot", columnDefinition = "jsonb")
    List<AddOnSnapshot> addOnSnapshot;

    @Type(JsonType.class)
    @Column(name = "pricing_snapshot", columnDefinition = "jsonb")
    PricingSnapshot pricingSnapshot;

    @Type(JsonType.class)
    @Column(name = "provider_snapshot", columnDefinition = "jsonb")
    ProviderSnapshot providerSnapshot;

    @Type(JsonType.class)
    @Column(name = "requirement_values", columnDefinition = "jsonb")
    Map<String, Object> requirementValues;

    @Type(JsonType.class)
    @Column(name = "execution_snapshot", columnDefinition = "jsonb")
    ExecutionSnapshot executionSnapshot;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    Order order;

}
