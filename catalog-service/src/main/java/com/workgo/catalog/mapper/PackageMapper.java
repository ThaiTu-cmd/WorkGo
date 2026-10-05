package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.PackageUpdateRequest;
import com.workgo.catalog.dto.response.PackageResponse;
import com.workgo.catalog.entity.Package;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PackageMapper {

    @Mapping(target = "serviceId", source = "service.serviceId")
    PackageResponse toPackageResponse(Package pkg);

    void updatePackage(@MappingTarget Package pkg, PackageUpdateRequest request);

}
