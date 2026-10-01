package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.ServiceCreationRequest;
import com.workgo.catalog.dto.request.ServiceUpdateRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.entity.Service;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ServiceMapper {

    ServiceCreationResponse toServiceCreationResponse(ServiceCreationRequest request);

    ServiceResponse toServiceResponse(Service service);

    void updateService(@MappingTarget Service service, ServiceUpdateRequest request);

}
