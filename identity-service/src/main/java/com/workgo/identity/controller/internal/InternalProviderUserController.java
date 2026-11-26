package com.workgo.identity.controller.internal;
import com.workgo.identity.repository.InternalProviderProfileRepository;
import com.workgo.identity.dto.response.InternalProviderProfileResponse;
import com.workgo.identity.Exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/providers/by-user")
public class InternalProviderUserController {
    private final InternalProviderProfileRepository profiles;
    @GetMapping("/{id}") public InternalProviderProfileResponse get(@PathVariable UUID id){return profiles.findByUserId(id).orElseThrow(()->new AppException(ErrorCode.PROVIDER_PROFILE_NOT_EXISTED));}
}
