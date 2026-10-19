package com.workgo.order.mapper;

import com.workgo.order.dto.response.OrderItemResponse;
import com.workgo.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {

    @Mapping(target = "orderId", source = "order.orderId")
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);

}
