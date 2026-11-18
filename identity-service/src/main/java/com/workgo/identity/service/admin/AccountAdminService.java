package com.workgo.identity.service.admin;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.UserMapper;
import com.workgo.identity.dto.request.AccountLockRequest;
import com.workgo.identity.dto.request.AdminUserUpdateRequest;
import com.workgo.identity.dto.request.RoleChangeRequest;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.entity.Role;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.UserRole;
import com.workgo.identity.enumeration.AdminActionType;
import com.workgo.identity.enumeration.RoleName;
import com.workgo.identity.enumeration.UserStatus;
import com.workgo.identity.repository.RoleRepository;
import com.workgo.identity.repository.UserRepository;
import com.workgo.identity.repository.UserRoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AccountAdminService {

    static Duration REAUTHENTICATION_WINDOW = Duration.ofMinutes(5);
    static Set<RoleName> MANAGED_ROLES = EnumSet.of(RoleName.ADMIN, RoleName.SUPER_ADMIN);

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserRoleRepository userRoleRepository;
    UserMapper userMapper;
    AdminAuditService adminAuditService;

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse updateUser(UUID userId, AdminUserUpdateRequest request) {

        assertReason(request.getReason());

        User user = loadUser(userId, request.getVersion());
        assertNotSelf(user);

        List<String> updatedFields = new ArrayList<>();

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
            updatedFields.add("firstName");
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
            updatedFields.add("lastName");
        }

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(request.getEmail())) throw new AppException(ErrorCode.EMAIL_EXISTED);
            user.setEmail(request.getEmail());
            updatedFields.add("email");
        }

        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone())) throw new AppException(ErrorCode.PHONE_EXISTED);
            user.setPhone(request.getPhone());
            updatedFields.add("phone");
        }

        User savedUser = userRepository.save(user);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.USER_UPDATED)
                .targetType("USER")
                .targetId(userId)
                .reason(request.getReason())
                .afterState(Map.of("updatedFields", updatedFields))
                .build());

        return userMapper.toUserResponse(savedUser);
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void lockUser(UUID userId, AccountLockRequest request) {

        assertReason(request.getReason());
        assertRecentlyAuthenticated();

        User user = loadUser(userId, request.getVersion());
        assertNotSelf(user);

        if (hasRole(user, RoleName.SUPER_ADMIN)) assertNotLastSuperAdmin();

        UserStatus beforeStatus = user.getStatus();

        user.setStatus(UserStatus.DISABLE);
        user.setAuthorizationVersion(user.getAuthorizationVersion() + 1);

        userRepository.save(user);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.USER_DISABLED)
                .targetType("USER")
                .targetId(userId)
                .reason(request.getReason())
                .beforeState(Map.of("status", beforeStatus))
                .afterState(Map.of("status", UserStatus.DISABLE))
                .build());
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse grantRole(UUID userId, RoleChangeRequest request) {

        assertReason(request.getReason());
        assertManagedRole(request.getRoleName());
        assertRecentlyAuthenticated();

        User user = loadUser(userId, request.getVersion());
        assertNotSelf(user);

        if (hasRole(user, request.getRoleName())) throw new AppException(ErrorCode.ROLE_ALREADY_GRANTED);

        List<RoleName> beforeRoles = roleNames(user);

        Role role = roleRepository.findById(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        UserRole userRole = userRoleRepository.save(UserRole.builder()
                .grantedAt(Instant.now())
                .userNameHost(currentJwt().getSubject())
                .user(user)
                .role(role)
                .build());

        user.getUserRoles().add(userRole);
        user.setAuthorizationVersion(user.getAuthorizationVersion() + 1);

        User savedUser = userRepository.save(user);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.ROLE_GRANTED)
                .targetType("USER")
                .targetId(userId)
                .reason(request.getReason())
                .beforeState(Map.of("roles", beforeRoles))
                .afterState(Map.of("roles", roleNames(savedUser)))
                .build());

        return userMapper.toUserResponse(savedUser);
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse revokeRole(UUID userId, RoleChangeRequest request) {

        assertReason(request.getReason());
        assertManagedRole(request.getRoleName());
        assertRecentlyAuthenticated();

        User user = loadUser(userId, request.getVersion());
        assertNotSelf(user);

        UserRole userRole = user.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRoleName() == request.getRoleName())
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_GRANTED));

        if (request.getRoleName() == RoleName.SUPER_ADMIN) assertNotLastSuperAdmin();

        List<RoleName> beforeRoles = roleNames(user);

        user.getUserRoles().remove(userRole);
        userRoleRepository.delete(userRole);
        user.setAuthorizationVersion(user.getAuthorizationVersion() + 1);

        User savedUser = userRepository.save(user);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.ROLE_REVOKED)
                .targetType("USER")
                .targetId(userId)
                .reason(request.getReason())
                .beforeState(Map.of("roles", beforeRoles))
                .afterState(Map.of("roles", roleNames(savedUser)))
                .build());

        return userMapper.toUserResponse(savedUser);
    }

    //=====================================

    private User loadUser(UUID userId, Long version) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (version == null || !version.equals(user.getVersion())) {
            throw new AppException(ErrorCode.STALE_VERSION);
        }

        return user;
    }

    private void assertReason(String reason) {

        if (reason == null || reason.isBlank() || reason.length() > 500) {
            throw new AppException(ErrorCode.REASON_REQUIRED);
        }
    }

    private void assertManagedRole(RoleName roleName) {

        if (roleName == null || !MANAGED_ROLES.contains(roleName)) {
            throw new AppException(ErrorCode.ROLE_NOT_GRANTABLE);
        }
    }

    private void assertNotSelf(User user) {

        if (user.getUserId().toString().equals(currentJwt().getClaimAsString("userId"))) {
            throw new AppException(ErrorCode.SELF_ACCOUNT_CHANGE_NOT_ALLOWED);
        }
    }

    private void assertRecentlyAuthenticated() {

        Object authTime = currentJwt().getClaim("authTime");

        if (!(authTime instanceof Number seconds)
                || Instant.ofEpochSecond(seconds.longValue()).isBefore(Instant.now().minus(REAUTHENTICATION_WINDOW))) {
            throw new AppException(ErrorCode.REAUTHENTICATION_REQUIRED);
        }
    }

    private void assertNotLastSuperAdmin() {

        if (userRoleRepository.countByRole_RoleNameAndUser_Status(RoleName.SUPER_ADMIN, UserStatus.ACTIVE) <= 1) {
            throw new AppException(ErrorCode.LAST_SUPER_ADMIN);
        }
    }

    private boolean hasRole(User user, RoleName roleName) {

        return user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getRoleName() == roleName);
    }

    private List<RoleName> roleNames(User user) {

        return user.getUserRoles().stream()
                .map(userRole -> userRole.getRole().getRoleName())
                .sorted()
                .toList();
    }

    private Jwt currentJwt() {

        return (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
