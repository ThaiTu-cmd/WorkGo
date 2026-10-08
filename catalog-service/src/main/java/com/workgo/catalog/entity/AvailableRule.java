package com.workgo.catalog.entity;

import com.workgo.catalog.enumeration.RuleStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.security.PrivilegedExceptionAction;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "available_rules")
@SQLRestriction("is_deleted = 0")
public class AvailableRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "available_rule_id")
    UUID availableRuleId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    RuleStatus status;

    @Column(name = "slot_duration_minute")
    int slotDurationMinute;

    @Column(name = "end_time")
    Instant endTime;

    @Column(name = "start_time")
    Instant startTime;

    @Column(name = "day_of_weeek")
    int dayOfWeek;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;


    //=======================FK===========
    @ManyToOne
    @JoinColumn(name = "service_id")
    Service service;

}
