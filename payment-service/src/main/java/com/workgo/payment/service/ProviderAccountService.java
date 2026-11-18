package com.workgo.payment.service;

import com.workgo.payment.dto.response.client.ProviderProfileResponse;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.client.IdentityInternalClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.UUID;

//vi gan theo userId, order chi biet providerId
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ProviderAccountService {

    IdentityInternalClient identityInternalClient;

    public UUID userIdOf(UUID providerId) {

        try {
            ProviderProfileResponse provider = identityInternalClient.getProviderProfile(providerId);
            if (provider == null || provider.getUserId() == null) {
                throw new AppException(ErrorCode.IDENTITY_SERVICE_UNAVAILABLE);
            }
            return provider.getUserId();
        } catch (FeignException e) {
            throw new AppException(ErrorCode.IDENTITY_SERVICE_UNAVAILABLE);
        }
    }
}
