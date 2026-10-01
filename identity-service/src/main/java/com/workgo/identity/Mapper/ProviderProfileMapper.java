package com.workgo.identity.Mapper;

import com.workgo.identity.dto.request.ProviderProfileUpdateRequest;
import com.workgo.identity.dto.response.ProviderProfileResponse;
import com.workgo.identity.entity.ProviderProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProviderProfileMapper {

    @Mapping(target = "userId", source = "user.userId")
    ProviderProfileResponse toProviderProfileResponse(ProviderProfile providerProfile);

    void updateProviderProfile(@MappingTarget ProviderProfile providerProfile,
                               ProviderProfileUpdateRequest request);
}