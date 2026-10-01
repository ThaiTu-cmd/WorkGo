package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.ProviderVerificationMapper;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.ProviderVerificationCreationRequest;
import com.workgo.identity.dto.request.ProviderVerificationReviewRequest;
import com.workgo.identity.dto.response.ProviderVerificationResponse;
import com.workgo.identity.entity.ProviderProfile;
import com.workgo.identity.entity.ProviderVerification;
import com.workgo.identity.entity.User;
import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.repository.ProviderProfileRepository;
import com.workgo.identity.repository.ProviderVerificationRepository;
import com.workgo.identity.util.AttributeUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderVerificationService {

    ProviderVerificationRepository providerVerificationRepository;
    ProviderProfileRepository providerProfileRepository;
    ProviderVerificationMapper providerVerificationMapper;
    AttributeUtil attributeUtil;

    public ProviderVerificationResponse createVerification(ProviderVerificationCreationRequest request) {
        User user = attributeUtil.getCurrentUser();

        ProviderProfile providerProfile = providerProfileRepository
                .findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));

        if (providerVerificationRepository
                .existsByProviderProfile_ProviderProfileIdAndVerificationStatus(
                        providerProfile.getProviderProfileId(), VerificationStatus.PENDING)) {
            throw new AppException(ErrorCode.PROVIDER_VERIFICATION_PENDING);
        }

        ProviderVerification verification = ProviderVerification.builder()
                .verificationType(request.getVerificationType())
                .documentType(request.getDocumentType())
                .submittedAt(Instant.now())
                .providerProfile(providerProfile)
                .build();

        providerVerificationRepository.save(verification);

        return providerVerificationMapper.toProviderVerificationResponse(verification);
    }


    public PageResponse<ProviderVerificationResponse> getMyVerifications(int page, int size) {
        User user = attributeUtil.getCurrentUser();

        ProviderProfile providerProfile = providerProfileRepository
                .findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = providerVerificationRepository
                .findAllByProviderProfile_ProviderProfileId(
                        providerProfile.getProviderProfileId(), pageable);

        return PageResponse.<ProviderVerificationResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(providerVerificationMapper::toProviderVerificationResponse)
                        .toList())
                .build();
    }

    public ProviderVerificationResponse getVerification(UUID verificationId) {
        ProviderVerification verification = providerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_VERIFICATION_NOT_EXISTED));

        return providerVerificationMapper.toProviderVerificationResponse(verification);
    }


    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ProviderVerificationResponse> getVerificationsByStatus(
            VerificationStatus status, int page, int size) {

        Sort sort = Sort.by("submittedAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = providerVerificationRepository.findAllByVerificationStatus(status, pageable);

        return PageResponse.<ProviderVerificationResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(providerVerificationMapper::toProviderVerificationResponse)
                        .toList())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public ProviderVerificationResponse reviewVerification(
            UUID verificationId, ProviderVerificationReviewRequest request) {

        ProviderVerification verification = providerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_VERIFICATION_NOT_EXISTED));

        User admin = attributeUtil.getCurrentUser();

        verification.setVerificationStatus(request.getVerificationStatus());
        verification.setVerifiedAt(Instant.now());
        verification.setVerifiedBy(admin.getUserId());
        verification.setUpdatedAt(Instant.now());

        if (request.getVerificationStatus() == VerificationStatus.VERIFIED) {
            ProviderProfile profile = verification.getProviderProfile();
            profile.setVerificationStatus(VerificationStatus.VERIFIED);
            profile.setUpdatedAt(Instant.now());
            providerProfileRepository.save(profile);
        }

        return providerVerificationMapper.toProviderVerificationResponse(
                providerVerificationRepository.save(verification));
    }

    public void deleteVerification(UUID verificationId) {
        ProviderVerification verification = providerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_VERIFICATION_NOT_EXISTED));

        verification.setIsDeleted(attributeUtil.createDeletedMark());
        verification.setUpdatedAt(Instant.now());

        providerVerificationRepository.save(verification);
    }
}