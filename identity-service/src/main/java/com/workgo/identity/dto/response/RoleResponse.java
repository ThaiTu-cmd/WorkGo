package com.workgo.identity.dto.response;

import com.workgo.identity.enumeration.RoleName;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleResponse {

    RoleName roleName;

}
