package com.workgo.order.mapper;

import com.workgo.order.dto.response.DeliveryFileResponse;
import com.workgo.order.entity.DeliveryFile;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DeliveryFileMapper {


    DeliveryFileResponse toResponse(DeliveryFile deliveryFile);

}
