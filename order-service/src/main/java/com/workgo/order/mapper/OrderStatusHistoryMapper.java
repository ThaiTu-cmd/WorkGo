package com.workgo.order.mapper;

import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.entity.OrderStatusHistory;
import com.workgo.order.enumeration.OrderStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderStatusHistoryMapper {

    @Mapping(target = "orderId", source = "order.orderId")
    OrderStatusHistoryResponse toOrderHistoryResponse(OrderStatusHistory history);

}
