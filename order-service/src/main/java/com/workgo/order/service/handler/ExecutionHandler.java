package com.workgo.order.service.handler;

import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.ExecutionType;

public interface ExecutionHandler {

    ExecutionType supports();

    //check tinh hop le
    void validateCreate(OrderCreationRequest request);

    //tao execution theo loai
    Execution create(Order order, OrderCreationRequest request, PackageResponse packageResponse);

}
