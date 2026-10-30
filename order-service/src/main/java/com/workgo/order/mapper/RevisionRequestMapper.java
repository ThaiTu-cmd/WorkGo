package com.workgo.order.mapper;

import com.workgo.order.dto.response.RevisionRequestResponse;
import com.workgo.order.entity.RevisionRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RevisionRequestMapper {

    @Mapping(target = "deliveryPackageId", source = "deliveryPackage.deliveryPackageId")
    RevisionRequestResponse toResponse(RevisionRequest revisionRequest);

}
