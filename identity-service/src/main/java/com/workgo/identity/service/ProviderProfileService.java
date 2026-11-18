package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.ProviderProfileMapper;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.ProviderProfileCreationRequest;
import com.workgo.identity.dto.request.ProviderProfileUpdateRequest;
import com.workgo.identity.dto.response.ProviderProfileResponse;
import com.workgo.identity.entity.ProviderProfile;
import com.workgo.identity.entity.Role;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.UserRole;
import com.workgo.identity.enumeration.AdminActionType;
import com.workgo.identity.enumeration.RoleName;
import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.repository.*;
import com.workgo.identity.service.admin.AdminAction;
import com.workgo.identity.service.admin.AdminAuditService;
import com.workgo.identity.util.AttributeUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderProfileService {

    ProviderProfileRepository providerProfileRepository;
    ProviderVerificationRepository providerVerificationRepository;
    ProviderProfileMapper providerProfileMapper;
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserRoleRepository userRoleRepository;
    AttributeUtil attributeUtil;
    AdminAuditService adminAuditService;


    //Tao provider profile
    public ProviderProfileResponse createProviderProfile(ProviderProfileCreationRequest request) {
        User user = attributeUtil.getCurrentUser();
        if (providerProfileRepository.existsByUser_UserId(user.getUserId()) )
            throw new AppException(ErrorCode.USER_ALREADY_PROVIDER);

        ProviderProfile providerProfile = ProviderProfile.builder()
                .providerType(request.getProviderType())
                .businessName(request.getBusinessName())
                .bio(request.getBio())
                .verificationStatus(VerificationStatus.PENDING)
                .user(user)
                .build();

        ProviderProfile savedProfile = providerProfileRepository.save(providerProfile);

        return providerProfileMapper.toProviderProfileResponse(savedProfile);
    }

    public ProviderProfileResponse getMyProviderProfile() {
        User user = attributeUtil.getCurrentUser();
        ProviderProfile providerProfile = providerProfileRepository
                .findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));

        return providerProfileMapper.toProviderProfileResponse(providerProfile);
    }


    public ProviderProfileResponse getProviderProfile(UUID providerId) {
        ProviderProfile providerProfile = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        return providerProfileMapper.toProviderProfileResponse(providerProfile);
    }


    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PageResponse<ProviderProfileResponse> getProvidersByVerificationStatus(
            VerificationStatus status, int page, int size) {

        Sort sort = Sort.by("joinedAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = providerProfileRepository.findAllByVerificationStatus(status, pageable);

        return PageResponse.<ProviderProfileResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(providerProfileMapper::toProviderProfileResponse)
                        .toList())
                .build();
    }


    public ProviderProfileResponse updateMyProviderProfile(ProviderProfileUpdateRequest request) {
        User user = attributeUtil.getCurrentUser();

        ProviderProfile providerProfile = providerProfileRepository
                .findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));

        providerProfileMapper.updateProviderProfile(providerProfile, request);
        providerProfile.setUpdatedAt(Instant.now());

        return providerProfileMapper.toProviderProfileResponse(providerProfileRepository.save(providerProfile));
    }


    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ProviderProfileResponse updateVerificationStatus(UUID providerId, VerificationStatus status) {
        ProviderProfile providerProfile = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));

        User user = providerProfile.getUser();
        VerificationStatus beforeStatus = providerProfile.getVerificationStatus();

        providerProfile.setVerificationStatus(
                providerProfile.getVerificationStatus().transitionTo(status));

        if(status == VerificationStatus.VERIFIED){
            if(providerVerificationRepository.existsByVerificationStatusAndProviderProfile_ProviderProfileId
                    (VerificationStatus.REJECTED, providerId)
                    || providerVerificationRepository.existsByVerificationStatusAndProviderProfile_ProviderProfileId
                    (VerificationStatus.SUSPENDED, providerId)){

            }

            boolean hasProviderRole = user.getUserRoles().stream()
                    .anyMatch(userRole -> userRole.getRole().getRoleName() == RoleName.PROVIDER);

            if(!hasProviderRole){
                Role role = roleRepository.findById(RoleName.PROVIDER)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

                UserRole userRole = UserRole.builder()
                        .grantedAt(Instant.now())
                        .userNameHost("System")
                        .user(user)
                        .role(role)
                        .build();

                userRoleRepository.save(userRole);

                user.getUserRoles().add(userRole);
                user.setAuthorizationVersion(user.getAuthorizationVersion() + 1);
            }

            user.setProviderProfile(providerProfile);
            userRepository.save(user);
        }


        providerProfile.setUpdatedAt(Instant.now());

        ProviderProfile savedProfile = providerProfileRepository.save(providerProfile);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.PROVIDER_STATUS_UPDATED)
                .targetType("PROVIDER_PROFILE")
                .targetId(providerId)
                .beforeState(Map.of("verificationStatus", beforeStatus))
                .afterState(Map.of("verificationStatus", savedProfile.getVerificationStatus()))
                .build());

        return providerProfileMapper.toProviderProfileResponse(savedProfile);
    }


    public void deleteMyProviderProfile() {
        User user = attributeUtil.getCurrentUser();
        ProviderProfile providerProfile = providerProfileRepository
                .findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));

        providerProfile.setIsDeleted(attributeUtil.createDeletedMark());
        providerProfile.setUpdatedAt(Instant.now());

        providerProfileRepository.save(providerProfile);
    }

}
