package com.workgo.order.service.handler;

import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.entity.DigitalExecution;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.DigitalExecutionStatus;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.reppository.DigitalExecutionRepository;
import com.workgo.order.reppository.ExecutionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class DigitalExecutionHandler implements ExecutionHandler{

    ExecutionRepository executionRepository;
    DigitalExecutionRepository digitalExecutionRepository;

    @Override
    public ExecutionType supports() {
        return ExecutionType.DIGITAL;
    }

    @Override
    public void validateCreate(OrderCreationRequest request) {

    }

    @Override
    public Execution create(Order order, OrderCreationRequest request, PackageResponse packageResponse) {

        Execution execution = Execution.builder()
                .executionType(ExecutionType.DIGITAL)
                .order(order)
                .build();

        executionRepository.save(execution);

        DigitalExecution digitalExecution = DigitalExecution.builder()
                .status(DigitalExecutionStatus.AWAITING_REQUIREMENTS)
                .execution(execution)
                .revisionLimit(packageResponse.getRevisionLimit())
                .revisionsUsed(0)
                .deadlineAt(null)
                .build();

        digitalExecutionRepository.save(digitalExecution);

        return execution;
    }
}
