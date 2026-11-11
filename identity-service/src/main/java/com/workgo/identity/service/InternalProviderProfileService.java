package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.response.InternalProviderProfileResponse;
import com.workgo.identity.repository.InternalProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InternalProviderProfileService {
    private final InternalProviderProfileRepository repository;

    public InternalProviderProfileResponse getProviderProfile(UUID providerId) {
        return repository.findById(providerId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
    }
}
