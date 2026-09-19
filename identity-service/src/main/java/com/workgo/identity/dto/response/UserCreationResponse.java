package com.workgo.identity.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationResponse {

    String firstName;

    String lastName;

    String userName;

    String email;

    String phone;

}
