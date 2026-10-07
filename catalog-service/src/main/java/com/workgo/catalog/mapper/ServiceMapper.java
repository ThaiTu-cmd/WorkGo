package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.ServiceUpdateRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.entity.Service;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ServiceMapper {

    @Mapping(target = "categoryId", source = "category.categoryId")
    ServiceCreationResponse toServiceCreationResponse(Service request);

    @Mapping(target = "categoryId", source = "category.categoryId")
    ServiceResponse toServiceResponse(Service service);

    void updateService(@MappingTarget Service service, ServiceUpdateRequest request);

}
