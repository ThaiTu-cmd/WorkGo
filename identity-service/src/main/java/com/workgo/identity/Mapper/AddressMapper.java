package com.workgo.identity.Mapper;

import com.workgo.identity.dto.request.AddressUpdateRequest;
import com.workgo.identity.dto.response.AddressResponse;
import com.workgo.identity.entity.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "userId", source = "user.userId")
    AddressResponse toAddressResponse(Address address);

    void updateAddress(@MappingTarget Address address, AddressUpdateRequest request);



}
