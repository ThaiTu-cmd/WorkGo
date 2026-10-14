package com.workgo.order.mapper;

import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.entity.OrderStatusHistory;
import com.workgo.order.enumeration.OrderStatus;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderStatusHistoryMapper {

    OrderStatusHistoryResponse toOrderHistoryResponse(OrderStatusHistory history);

}
