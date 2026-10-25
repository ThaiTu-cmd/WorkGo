package com.workgo.order.service.handler;

import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.OnsiteExecution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OnsiteExecutionStatus;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OnsiteExecutionHandler implements ExecutionHandler{

    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;

    @Override
    public ExecutionType supports() {
        return ExecutionType.ONSITE;
    }

    @Override
    public void validateCreate(OrderCreationRequest request) {
        if (request.getBookingSlotId() == null) {
            throw new AppException(ErrorCode.ORDER_BOOKING_SLOT_REQUIRED);
        }
        if (request.getAddress() == null || request.getAddress().isBlank()) {
            throw new AppException(ErrorCode.ORDER_ADDRESS_REQUIRED);
        }
    }

    @Override
    public Execution create(Order order, OrderCreationRequest request, PackageResponse packageResponse) {
        Execution execution = Execution.builder()
                .executionType(ExecutionType.ONSITE)
                .order(order)
                .build();

        executionRepository.save(execution);

        onsiteExecutionRepository.save(OnsiteExecution.builder()
                .status(OnsiteExecutionStatus.SCHEDULED)
                .addressSnapshot(request.getAddress())
                .bookingSlotId(request.getBookingSlotId())
                .execution(execution)
                .build());

        return execution;
    }
}
