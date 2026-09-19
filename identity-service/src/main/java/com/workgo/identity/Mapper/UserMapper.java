package com.workgo.identity.Mapper;

import com.workgo.identity.dto.request.UserCreationRequest;
import com.workgo.identity.dto.response.UserCreationResponse;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(UserCreationRequest request);

    UserCreationResponse toUserCreationResponse(User user);

    UserResponse toUserResponse(User user);

}
