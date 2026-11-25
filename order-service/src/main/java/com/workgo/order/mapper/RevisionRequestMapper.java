package com.workgo.order.mapper;

import com.workgo.order.dto.response.RevisionRequestResponse;
import com.workgo.order.entity.RevisionRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RevisionRequestMapper {

    @Mapping(target = "requestedAt", source = "createdAt")
    @Mapping(target = "adminSuggested", ignore = true)
    @Mapping(target = "supportRequired", ignore = true)
    @Mapping(target = "deliveryPackageId", source = "deliveryPackage.deliveryPackageId")
    RevisionRequestResponse toResponse(RevisionRequest revisionRequest);

}
