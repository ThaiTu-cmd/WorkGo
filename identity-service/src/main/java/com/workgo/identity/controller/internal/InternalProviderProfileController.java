package com.workgo.identity.controller.internal;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.response.ProviderProfileResponse;
import com.workgo.identity.entity.ProviderProfile;
import com.workgo.identity.service.ProviderProfileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/internal/providers")
public class InternalProviderProfileController {

    ProviderProfileService providerProfileService;

    @GetMapping("/{providerId}")
    ProviderProfileResponse getProviderProfile(
            @PathVariable UUID providerId
    ) {
        return providerProfileService.getProviderProfile(providerId);
    }

}
