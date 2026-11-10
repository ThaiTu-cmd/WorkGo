package com.workgo.order.mapper;

import com.workgo.order.dto.response.DeliveryPackageResponse;
import com.workgo.order.entity.DeliveryPackage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = DeliveryFileMapper.class)
public interface DeliveryPackageMapper {

    @Mapping(target = "executionId", source = "execution.executionId")
    DeliveryPackageResponse toResponse(DeliveryPackage deliveryPackage);

}
