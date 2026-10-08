package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.AddOnCreationRequest;
import com.workgo.catalog.dto.request.AddOnUpdateRequest;
import com.workgo.catalog.dto.response.AddOnResponse;
import com.workgo.catalog.entity.AddOn;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AddOnMapper {

    @Mapping(target = "service", source = "service.serviceId")
    AddOnResponse toAddOnResponse(AddOn addOn);

    void updateAddOn(@MappingTarget AddOn addOn, AddOnUpdateRequest request);

}
