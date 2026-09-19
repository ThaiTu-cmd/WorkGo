package com.workgo.identity.Mapper;

import com.workgo.identity.dto.response.RoleResponse;
import com.workgo.identity.entity.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    RoleResponse toRoleResponse(Role role);

}
