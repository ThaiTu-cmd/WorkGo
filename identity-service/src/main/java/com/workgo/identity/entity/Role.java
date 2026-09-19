package com.workgo.identity.entity;

import com.workgo.identity.enumeration.RoleName;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "role_name")
    RoleName roleName;

    //===FK===
    @Builder.Default
    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
    Set<UserRole> userRoles = new HashSet<>();


}
