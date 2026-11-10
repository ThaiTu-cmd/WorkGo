package com.workgo.order.mapper;

import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.TargetPropertyName;

import java.lang.annotation.Target;

@Mapper(componentModel = "spring", uses = {OrderItemMapper.class})
public interface OrderMapper {

    OrderResponse toOrderResponse(Order order);

}
