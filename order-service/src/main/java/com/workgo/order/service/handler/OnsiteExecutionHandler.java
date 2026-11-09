package com.workgo.order.service.handler;

import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.request.SlotActionRequest;
import com.workgo.order.dto.response.client.BookingSlotResponse;
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
import com.workgo.order.reppository.client.CatalogClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class OnsiteExecutionHandler implements ExecutionHandler{

    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    CatalogClient catalogClient;

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

        //giu slot ben catalog
        BookingSlotResponse slot = holdSlot(request.getBookingSlotId(), order.getOrderId());

        //tao don loi o buoc sau -> rollback
        releaseSlotOnRollback(slot.getBookingSlotId(), order.getOrderId());

        //slot phai thuoc dung service cua don
        if (!order.getServiceId().equals(slot.getService())) {
            throw new AppException(ErrorCode.ORDER_SLOT_NOT_MATCH_SERVICE);
        }

        Execution execution = Execution.builder()
                .executionType(ExecutionType.ONSITE)
                .order(order)
                .build();

        executionRepository.save(execution);

        onsiteExecutionRepository.save(OnsiteExecution.builder()
                .status(OnsiteExecutionStatus.SCHEDULED)
                .addressSnapshot(request.getAddress())
                .bookingSlotId(slot.getBookingSlotId())
                .scheduledStart(slot.getStartedAt())
                .scheduledEnd(slot.getEndAt())
                .slotHoldExpiresAt(slot.getHoldExpiresAt())
                .execution(execution)
                .build());

        return execution;
    }

    //=====================================

    private BookingSlotResponse holdSlot(UUID slotId, UUID orderId) {
        try {
            return catalogClient.holdSlot(slotId, SlotActionRequest.builder()
                    .orderId(orderId)
                    .build());
        } catch (FeignException e) {
            if (e.status() == HttpStatus.NOT_FOUND.value()) {
                throw new AppException(ErrorCode.ORDER_SLOT_NOT_FOUND);
            }
            //slot da co nguoi giu hoac da qua gio
            if (e.status() == HttpStatus.CONFLICT.value()) {
                throw new AppException(ErrorCode.ORDER_SLOT_NOT_AVAILABLE);
            }
            throw new AppException(ErrorCode.CATALOG_UNAVAILABLE);
        }
    }

    private void releaseSlotOnRollback(UUID slotId, UUID orderId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_ROLLED_BACK) {
                    return;
                }
                try {
                    catalogClient.releaseSlot(slotId, SlotActionRequest.builder()
                            .orderId(orderId)
                            .build());
                } catch (Exception e) {
                    log.warn("Release slot {} failed for order {}", slotId, orderId, e);
                }
            }
        });
    }
}
