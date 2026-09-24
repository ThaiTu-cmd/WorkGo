package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.RoleMapper;
import com.workgo.identity.Mapper.UserMapper;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.UserCreationRequest;
import com.workgo.identity.dto.request.UserUpdateRequest;
import com.workgo.identity.dto.response.UserCreationResponse;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.entity.Role;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.UserRole;
import com.workgo.identity.enumeration.RoleName;
import com.workgo.identity.enumeration.UserStatus;
import com.workgo.identity.repository.RoleRepository;
import com.workgo.identity.repository.UserRepository;
import com.workgo.identity.repository.UserRoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.time.Instant;
import java.util.HashSet;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserService {

    UserMapper userMapper;
    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    UserRoleRepository userRoleRepository;
    RoleMapper roleMapper;

    public UserCreationResponse createUser(UserCreationRequest request) {

        if (userRepository.existsByUserName(request.getUserName()) || userRepository.existsByEmail(request.getEmail()))
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

        userRepository.save(user);

        Role role = roleRepository.findById(RoleName.CLIENT)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        UserRole userRole = UserRole.builder()
                .grantedAt(Instant.now())
                .userNameHost("System")
                .user(user)
                .role(role)
                .build();

        userRoleRepository.save(userRole);

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

    @PreAuthorize("hasAnyRole('ADMIN')")
    public PageResponse<UserResponse> getUsers(int page, int size){

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = userRepository.findAll(pageable);

        return PageResponse.<UserResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(userMapper::toUserResponse)
                        .toList())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(UUID userId){

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    public UserResponse updateUser(UUID userId, UserUpdateRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        return userMapper.toUserResponse(userRepository.save(user));
    }


    public void deleteUser(UUID userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setStatus(UserStatus.DISABLE);

        userRepository.save(user);
    }
}
