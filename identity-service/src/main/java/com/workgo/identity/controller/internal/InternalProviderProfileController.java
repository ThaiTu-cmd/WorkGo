package com.workgo.identity.controller.internal;

import com.workgo.identity.dto.response.InternalProviderProfileResponse;
import com.workgo.identity.service.InternalProviderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/providers")
public class InternalProviderProfileController {
    private final InternalProviderProfileService providerProfileService;

    @GetMapping("/{providerId}")
    InternalProviderProfileResponse getProviderProfile(@PathVariable UUID providerId) {
        return providerProfileService.getProviderProfile(providerId);
    }
}
