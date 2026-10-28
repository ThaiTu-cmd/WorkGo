package com.workgo.order.service;

import com.workgo.order.dto.request.CheckinRequest;
import com.workgo.order.dto.response.OnsiteExecutionResponse;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.OnsiteExecution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.ExecutionMapper;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.WorkEvidenceRepository;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OnsiteFlowService {

    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    WorkEvidenceRepository workEvidenceRepository;
    OrderStatusService orderStatusService;
    ExecutionMapper executionMapper;
    TokenUtils tokenUtils;
    PasswordEncoder passwordEncoder;

    @Transactional
    public OnsiteExecutionResponse checkin(UUID orderId, CheckinRequest request){

        Order order = loadOrder(orderId);
        assertIsProvider(order);
        assertOnsite(order);

        //order da confirm thi moi checkin duoc
        if (order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        OnsiteExecution onsite = loadOnsite(execution.getExecutionId());

        //phan onsite da phai duoc len lich trinh san
        if (onsite.getStatus() != OnsiteExecutionStatus.SCHEDULED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        if (request.getCode() == null
                || onsite.getCheckinCodeHash() == null
                || !passwordEncoder.matches(request.getCode(), onsite.getCheckinCodeHash())) {
            throw new AppException(ErrorCode.ORDER_CHECKIN_CODE_INVALID);
        }

        Instant now = Instant.now();

        //neu da co lich hen thi chi cho checkin som 30 phut
        if (onsite.getScheduledStart() != null
                && now.isBefore(onsite.getScheduledStart().minus(Duration.ofMinutes(30)))) {
            throw new AppException(ErrorCode.ORDER_CHECKIN_TIME_INVALID);
        }

        //onsite
        onsite.setArrivedAt(now);
        onsite.setStatus(OnsiteExecutionStatus.IN_SERVICE);
        onsiteExecutionRepository.save(onsite);

        //execution
        execution.setStartedAt(now);
        executionRepository.save(execution);

        orderStatusService.transition(order, OrderStatus.IN_PROGRESS,
                tokenUtils.getCurrentProviderId(), RoleName.PROVIDER);

        return executionMapper.toOnsiteExecutionResponse(onsite);

    }

    //provider danh dau hoan thanh (phai cho client duyet)
    @Transactional
    public OnsiteExecutionResponse complete(UUID orderId) {

        Order order = loadOrder(orderId);
        assertIsProvider(order);
        assertOnsite(order);

        if (order.getOrderStatus() != OrderStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        OnsiteExecution onsite = loadOnsite(execution.getExecutionId());

        if (onsite.getStatus() != OnsiteExecutionStatus.IN_SERVICE) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        //kiem tra xem co bang chung da hoan thanh cong viec chua
        boolean hasAfterEvidence = workEvidenceRepository
                .existsByExecution_ExecutionIdAndPhase(
                        execution.getExecutionId(), EvidencePhase.AFTER);

        if (!hasAfterEvidence) {
            throw new AppException(ErrorCode.ORDER_EVIDENCE_AFTER_REQUIRED);
        }

        Instant now = Instant.now();

        onsite.setServiceCompletedAt(now);
        onsite.setStatus(OnsiteExecutionStatus.SERVICE_DONE);
        onsiteExecutionRepository.save(onsite);

        execution.setDeliveredAt(now);
        executionRepository.save(execution);

        //24h sau tu dong hoan thanh neu client khong accept
        order.setAutoCompleteAt(now.plus(Duration.ofHours(24)));

        //chuyen doi order sang trang thai da giao
        orderStatusService.transition(order, OrderStatus.DELIVERED,
                tokenUtils.getCurrentProviderId(), RoleName.PROVIDER);

        return executionMapper.toOnsiteExecutionResponse(onsite);
    }

    //client duyet phan complete cua provider
    @Transactional
    public OnsiteExecutionResponse accept(UUID orderId) {

        Order order = loadOrder(orderId);
        assertIsClient(order);
        assertOnsite(order);

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        OnsiteExecution onsite = loadOnsite(execution.getExecutionId());

        if (onsite.getStatus() != OnsiteExecutionStatus.SERVICE_DONE) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();

        onsite.setStatus(OnsiteExecutionStatus.ACCEPT);
        onsiteExecutionRepository.save(onsite);

        execution.setCompletedAt(now);
        executionRepository.save(execution);

        orderStatusService.transition(order, OrderStatus.COMPLETED,
                tokenUtils.getCurrentUserId(), RoleName.CLIENT);

        return executionMapper.toOnsiteExecutionResponse(onsite);
    }

    private Order loadOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private Execution loadExecution(UUID orderId) {
        return executionRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));
    }

    private OnsiteExecution loadOnsite(UUID executionId) {
        return onsiteExecutionRepository.findByExecution_ExecutionId(executionId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));
    }

    private void assertOnsite(Order order) {
        if (order.getExecutionType() != ExecutionType.ONSITE) {
            throw new AppException(ErrorCode.ORDER_EXECUTION_TYPE_NOT_SUPPORTED);
        }
    }

    private void assertIsProvider(Order order) {
        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();

        if (providerId == null || !providerId.equals(order.getProviderId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void assertIsClient(Order order) {
        if (!tokenUtils.getCurrentUserId().equals(order.getClientId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

}
