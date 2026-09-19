package com.workgo.identity.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.workgo.identity.enumeration.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "users")
@SQLRestriction("status = 'ACTIVE'")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    UUID userId;

    @Column(name = "first_name")
    String firstName;

    @Column(name = "last_name")
    String lastName;

    @Column(name = "user_name", unique = true)
    String userName;

    @Column(name = "password")
    String password;

    @Column(name = "phone", unique = true)
    String phone;

    @Column(name = "email", unique = true)
    String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    UserStatus status;

    @Column(name = "avatar_url")
    String avatarUrl;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //===FK===

    // 1-N role
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    Set<UserRole> userRoles = new HashSet<>();

    // 1-N address
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    Set<Address> addresses = new HashSet<>();
}
