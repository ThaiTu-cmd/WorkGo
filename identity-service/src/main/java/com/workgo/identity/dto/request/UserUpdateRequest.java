package com.workgo.identity.dto.request;

import com.workgo.identity.enumeration.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {

    String firstName;

    String lastName;

    String userName;

    String password;

    String email;

    String phone;

    String avatarUrl;
}
