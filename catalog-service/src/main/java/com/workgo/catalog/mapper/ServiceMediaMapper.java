package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.ServiceMediaUpdateRequest;
import com.workgo.catalog.dto.response.ServiceMediaResponse;
import com.workgo.catalog.entity.ServiceMedia;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ServiceMediaMapper {

    @Mapping(target = "service", source = "service.serviceId")
    ServiceMediaResponse toServiceMediaResponse(ServiceMedia serviceMedia);

    void updateMediaService(@MappingTarget ServiceMedia serviceMedia, ServiceMediaUpdateRequest request);

}
