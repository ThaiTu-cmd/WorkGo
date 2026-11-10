package com.workgo.order.entity;

import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.RoleName;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_status_history_id")
    UUID orderStatusHistoryId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "from_status")
    OrderStatus fromStatus;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "to_status")
    OrderStatus toStatus;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //=================FK================
    @ManyToOne
    @JoinColumn(name = "order_id")
    Order order;

    @Column(name = "actor_id")
    UUID actorId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "role_name")
    RoleName roleName;




}
