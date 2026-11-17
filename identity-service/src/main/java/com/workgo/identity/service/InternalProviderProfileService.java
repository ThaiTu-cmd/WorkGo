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

    @Transactional
    public InternalProviderProfileResponse updateRatingStats(UUID providerId, RatingStatsRequest request) {
        if (request == null || request.getRatingAvg() == null || request.getRatingCount() == null
                || request.getAggregateVersion() == null || request.getAggregateVersion() <= 0
                || !Double.isFinite(request.getRatingAvg())
                || request.getRatingAvg() < 0 || request.getRatingAvg() > 5
                || request.getRatingCount() < 0
                || (request.getRatingCount() == 0 && request.getRatingAvg() != 0)) {
            throw new AppException(ErrorCode.RATING_STATS_INVALID);
        }

        var current = repository.lockRatingSnapshot(providerId)
                .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));
        if (request.getAggregateVersion() == current.version()
                && (request.getRatingAvg() != current.average() || request.getRatingCount() != current.count())) {
            throw new AppException(ErrorCode.RATING_SNAPSHOT_CONFLICT);
        }
        if (request.getAggregateVersion() > current.version()) {
            repository.updateRatingStats(providerId, request.getRatingAvg(), request.getRatingCount(), request.getAggregateVersion());
        }

        return getProviderProfile(providerId);
    }
}
