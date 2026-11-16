package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.request.RatingStatsRequest;
import com.workgo.identity.dto.response.InternalProviderProfileResponse;
import com.workgo.identity.repository.InternalProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InternalProviderProfileService {
    private final InternalProviderProfileRepository repository;

    public InternalProviderProfileResponse getProviderProfile(UUID providerId) {
        return repository.findById(providerId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
    }

    //review-service cap nhat diem trung binh cua provider
    @Transactional
    public InternalProviderProfileResponse updateRatingStats(UUID providerId, RatingStatsRequest request) {
        if (request.getRatingAvg() == null || request.getRatingCount() == null
                || request.getRatingAvg() < 0 || request.getRatingAvg() > 5
                || request.getRatingCount() < 0) {
            throw new AppException(ErrorCode.RATING_STATS_INVALID);
        }

        if (repository.updateRatingStats(providerId, request.getRatingAvg(), request.getRatingCount()) == 0) {
            throw new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED);
        }

        return getProviderProfile(providerId);
    }
}
