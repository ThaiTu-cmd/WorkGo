package com.workgo.identity.Mapper;

import com.workgo.identity.dto.request.ProviderProfileUpdateRequest;
import com.workgo.identity.dto.response.ProviderProfileResponse;
import com.workgo.identity.dto.response.ProviderVerificationResponse;
import com.workgo.identity.entity.ProviderProfile;
import com.workgo.identity.entity.ProviderVerification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProviderVerificationMapper {


    @Mapping(target = "providerProfileId",
            source = "providerProfile.providerProfileId")
    ProviderVerificationResponse toProviderVerificationResponse(
            ProviderVerification providerVerification);
}