package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.RoleMapper;
import com.workgo.identity.Mapper.UserMapper;
import com.workgo.identity.dto.request.UserCreationRequest;
import com.workgo.identity.dto.response.UserCreationResponse;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.entity.Role;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.UserRole;
import com.workgo.identity.enumeration.RoleName;
import com.workgo.identity.enumeration.UserStatus;
import com.workgo.identity.repository.RoleRepository;
import com.workgo.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashSet;


@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserService {

    UserMapper userMapper;
    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    RoleMapper roleMapper;

    public UserCreationResponse createUser(UserCreationRequest request) {

        if (userRepository.existsByUserName(request.getUserName()))
            throw new AppException(ErrorCode.USER_EXISTED);

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .userName(request.getUserName())
                .password(hashedPassword)
                .phone(request.getPhone())
                .email(request.getEmail())
                .status(UserStatus.ACTIVE)
                .build();

        Role role = roleRepository.findById(RoleName.CLIENT)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        UserRole userRole = UserRole.builder()
                .grantedAt(Instant.now())
                .userNameHost("System")
                .user(user)
                .role(role)
                .build();

        HashSet<UserRole> userRoles = new HashSet<>();
        userRoles.add(userRole);
        user.setUserRoles(userRoles);

        userRepository.save(user);

        return UserCreationResponse.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .userName(user.getUserName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }

    public UserResponse getMyInfo() {
        String userName = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userName == null) throw new AppException(ErrorCode.USER_NOT_EXISTED);

        User user = userRepository.findByUserName(userName);
        if (user == null) throw new AppException(ErrorCode.USER_NOT_EXISTED);

        return userMapper.toUserResponse(user);
    }

}
