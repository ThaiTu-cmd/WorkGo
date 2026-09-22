package com.workgo.identity.Mapper;

import com.workgo.identity.dto.request.UserCreationRequest;
import com.workgo.identity.dto.request.UserUpdateRequest;
import com.workgo.identity.dto.response.RoleResponse;
import com.workgo.identity.dto.response.UserCreationResponse;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(UserCreationRequest request);

    UserCreationResponse toUserCreationResponse(User user);

    @Mapping(target = "roles", source = "userRoles")
    UserResponse toUserResponse(User user);

    @Mapping(target = "roleName", source = "role.roleName")
    RoleResponse toRoleResponse(UserRole userRole);

    void updateUser(@MappingTarget User user, UserUpdateRequest request);

}
