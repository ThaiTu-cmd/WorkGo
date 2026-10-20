package com.workgo.order.service;

import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.ExecutionResponse;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.ExecutionMapper;
import com.workgo.order.reppository.DigitalExecutionRepository;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.service.handler.ExecutionHandler;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ExecutionService {

    ExecutionRepository executionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    OrderRepository orderRepository;
    ExecutionMapper executionMapper;
    TokenUtils tokenUtils;

    Map<ExecutionType, ExecutionHandler> handlers;

    @Transactional(propagation = Propagation.MANDATORY)
    public Execution createFor(Order order, OrderCreationRequest request, PackageResponse packageResponse){

        ExecutionHandler handler = handlers.get(order.getExecutionType());

        if(handler == null){
            throw new AppException(ErrorCode.ORDER_EXECUTION_TYPE_NOT_SUPPORTED);
        }

        handler.validateCreate(request);

        return handler.create(order, request, packageResponse);

    }

    public ExecutionResponse getExecution(UUID orderId){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        tokenUtils.assertParticipant(order);

        Execution execution = executionRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        ExecutionResponse executionResponse = executionMapper.toExecutionResponse(execution);

        switch (execution.getExecutionType()){
            case DIGITAL -> {
                digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .ifPresent(digitalExecution ->
                                executionResponse.setDigital(executionMapper.toDigitalExecutionResponse(digitalExecution)));
            }

            case ONSITE -> {
                onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .ifPresent(onsiteExecution ->
                                executionResponse.setOnsite(executionMapper.toOnsiteExecutionResponse(onsiteExecution)));
            }

        }

        return executionResponse;
    }




}
