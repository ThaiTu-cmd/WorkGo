package com.workgo.order.entity;

import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.SourceType;
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
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "orders", uniqueConstraints = {
    @UniqueConstraint(name = "orderId_orderNumber", columnNames = {"order_id", "order_number"})
})
@SQLRestriction("is_deleted =  0")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_id")
    UUID orderId;

    @Column(name = "order_number", unique = true)
    String orderNumber;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "source_type")
    SourceType sourceType;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "execution_type")
    ExecutionType executionType;

    @Column(name = "title")
    String title;

    @Column(name = "sub_total")
    BigDecimal subtotal;

    @Column(name = "platform_fee")
    BigDecimal platformFee;

    @Column(name = "total_amount")
    BigDecimal totalAmount;

    @Column(name = "provider_net_amount")
    BigDecimal providerNetAmount;

    @Builder.Default
    @Column(name = "currency")
    String currency = "VND";

    @Enumerated(value = EnumType.STRING)
    @Column(name = "order_status")
    OrderStatus orderStatus;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "payment_status")
    PaymentStatus paymentStatus;

    @Column(name = "placed_at")
    Instant placedAt;

    @Column(name = "confirmed_at")
    Instant confirmedAt;

    @Column(name = "start_at")
    Instant startedAt;

    @Column(name = "delivered_at")
    Instant deliveredAt;

    @Column(name = "completed_at")
    Instant completedAt;

    @Column(name = "cancelled_at")
    Instant cancelledAt;

    @Column(name = "auto_completed_at")
    Instant autoCompleteAt;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //============FK===============

    @Builder.Default
    @OneToMany(mappedBy = "order")
    HashSet<OrderStatusHistory> orderStatusHistory = new HashSet<>();

    @Column(name = "source_id")
    UUID sourceId;

    @Column(name = "client_id")
    UUID clientId;

    @Column(name = "provider_id")
    UUID providerId;

    @Column(name = "service_id")
    UUID serviceId;

    @Column(name = "package_id")
    UUID packageId;

    @Builder.Default
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    Set<OrderItem> orderItem = new HashSet<>();

}
