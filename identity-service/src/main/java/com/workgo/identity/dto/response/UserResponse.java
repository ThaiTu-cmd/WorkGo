package com.workgo.identity.dto.response;

import com.workgo.identity.enumeration.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

    UUID userId;

    String firstName;

    String lastName;

    String userName;

    String email;

    String phone;

    UserStatus status;

    String avatarUrl;

    Instant createdAt;

    Set<RoleResponse> roles;
}
