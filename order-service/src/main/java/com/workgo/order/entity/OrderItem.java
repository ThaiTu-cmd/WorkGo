package com.workgo.order.entity;

import com.workgo.order.enumeration.ItemType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_item_id")
    UUID orderItemId;

    @Column(name = "name")
    String name;

    @Column(name = "quantity")
    int quantity;

    @Column(name = "unit_price")
    BigDecimal unitPrice;

    @Column(name = "amount")
    BigDecimal amount;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "item_type")
    ItemType itemType;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "sort_order")
    int sortOrder;

//    @Column(name = "updated_at")
//    Instant updatedAt;

    //===========FK===========

    @Column(name = "reference_id")
    UUID referenceId;

    @ManyToOne
    @JoinColumn(name = "order_id")
    Order order;

}
