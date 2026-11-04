package com.workgo.order.mapper;

import com.workgo.order.dto.response.CancellationRequestResponse;
import com.workgo.order.entity.CancellationRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CancellationRequestMapper {

    @Mapping(target = "orderId", source = "order.orderId")
    CancellationRequestResponse toResponse(CancellationRequest cancellationRequest);

}
