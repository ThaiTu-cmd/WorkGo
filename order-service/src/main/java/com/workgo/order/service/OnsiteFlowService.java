package com.workgo.order.service;

import com.workgo.order.dto.request.CheckinRequest;
import com.workgo.order.dto.response.CheckinCodeResponse;
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
import org.springframework.security.crypto.encrypt.TextEncryptor;
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
    private final DeadlinePolicyService deadlinePolicyService;
    private final TrustDisputeGuard trustDisputeGuard;
    private final DeliveryReadinessService deliveryReadinessService;

    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    WorkEvidenceRepository workEvidenceRepository;
    OrderStatusService orderStatusService;
    ExecutionMapper executionMapper;
    TokenUtils tokenUtils;
    PasswordEncoder passwordEncoder;
    TextEncryptor checkinCodeEncryptor;
    OrderInputService orderInputService;
    java.time.Clock clock;

    @Transactional
    public OnsiteExecutionResponse checkin(UUID orderId, CheckinRequest request){

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
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

        Instant now = clock.instant();

        //neu da co lich hen thi chi cho checkin som 30 phut
        if (onsite.getScheduledStart() != null
                && now.isBefore(onsite.getScheduledStart().minus(Duration.ofMinutes(30)))) {
            throw new AppException(ErrorCode.ORDER_CHECKIN_TIME_INVALID);
        }

        if (orderInputService.blockingReason(order) != null) throw new AppException(ErrorCode.ORDER_START_BLOCKED);

        //onsite
        onsite.setArrivedAt(now);
        onsite.setStatus(OnsiteExecutionStatus.IN_SERVICE);
        onsiteExecutionRepository.save(onsite);

        //execution
        execution.setStartedAt(now);
        executionRepository.save(execution);

        orderStatusService.transition(order, OrderStatus.IN_PROGRESS,
                tokenUtils.getCurrentProviderId(), RoleName.PROVIDER);
        order.setStartedAt(now);
        orderRepository.save(order);

        return executionMapper.toOnsiteExecutionResponse(onsite);

    }

    //provider danh dau hoan thanh (phai cho client duyet)
    @Transactional
    public OnsiteExecutionResponse complete(UUID orderId) {

        Order order = loadOrder(orderId);
        assertIsProvider(order);
        assertOnsite(order);

        boolean replacement = order.getOrderStatus() == OrderStatus.DELIVERED && deadlinePolicyService.requiresNewDelivery(order);
        if (order.getOrderStatus() != OrderStatus.IN_PROGRESS && !replacement) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        OnsiteExecution onsite = loadOnsite(execution.getExecutionId());

        if (onsite.getStatus() != OnsiteExecutionStatus.IN_SERVICE
                && !(replacement && onsite.getStatus() == OnsiteExecutionStatus.SERVICE_DONE)) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        //kiem tra xem co bang chung da hoan thanh cong viec chua
        boolean hasAfterEvidence = workEvidenceRepository
                .existsByExecution_ExecutionIdAndPhase(
                        execution.getExecutionId(), EvidencePhase.AFTER);

        if (!hasAfterEvidence) {
            throw new AppException(ErrorCode.ORDER_EVIDENCE_AFTER_REQUIRED);
        }

        Instant now = clock.instant();

        onsite.setServiceCompletedAt(now);
        onsite.setStatus(OnsiteExecutionStatus.SERVICE_DONE);
        onsiteExecutionRepository.save(onsite);

        execution.setDeliveredAt(now);
        executionRepository.save(execution);

        //24h sau tu dong hoan thanh neu client khong accept
        if (!deliveryReadinessService.ready(order,execution)) throw new AppException(ErrorCode.ORDER_EVIDENCE_AFTER_REQUIRED);
        deadlinePolicyService.submitted(order,"ONSITE:"+UUID.randomUUID());

        //chuyen doi order sang trang thai da giao
        if (replacement) {
            order.setDeliveredAt(now);
            orderRepository.save(order);
        } else orderStatusService.transition(order, OrderStatus.DELIVERED,
                tokenUtils.getCurrentProviderId(), RoleName.PROVIDER);

        return executionMapper.toOnsiteExecutionResponse(onsite);
    }

    //client duyet phan complete cua provider
    @Transactional
    public OnsiteExecutionResponse accept(UUID orderId) {

        Order order = lockOrder(orderId);
        assertIsClient(order);
        assertOnsite(order);
        deadlinePolicyService.assertCanAccept(order);
        if (!trustDisputeGuard.permitsPaymentSync(orderId)) throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        OnsiteExecution onsite = loadOnsite(execution.getExecutionId());

        if (onsite.getStatus() != OnsiteExecutionStatus.SERVICE_DONE) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        onsite.setStatus(OnsiteExecutionStatus.ACCEPT);
        onsite.setClientAcceptedAt(clock.instant());
        deadlinePolicyService.accepted(order);
        onsiteExecutionRepository.save(onsite);

        completeIfSettled(order, execution, onsite, tokenUtils.getCurrentUserId(), RoleName.CLIENT);

        return executionMapper.toOnsiteExecutionResponse(onsite);
    }

    //provider xac nhan da nhan du tien mat; client tu khai da tra khong du de ghi phi
    @Transactional
    public OnsiteExecutionResponse confirmCashReceived(UUID orderId) {

        Order order = lockOrder(orderId);
        assertIsProvider(order);
        assertOnsite(order);

        if (order.getPaymentMethod() != OrderPaymentMethod.CASH) {
            throw new AppException(ErrorCode.ORDER_PAYMENT_METHOD_NOT_ALLOWED);
        }

        if (order.getOrderStatus() != OrderStatus.IN_PROGRESS && order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        OnsiteExecution onsite = loadOnsite(execution.getExecutionId());

        if (onsite.getCashReceivedAt() == null) {
            onsite.setCashReceivedAt(clock.instant());
            onsiteExecutionRepository.save(onsite);
        }

        // Keep the receipt even when completion must wait; repeating this command is safe.
        if (!trustDisputeGuard.permitsPaymentSync(orderId)) return executionMapper.toOnsiteExecutionResponse(onsite);
        try { deadlinePolicyService.assertCanAccept(order); }
        catch (AppException e) { return executionMapper.toOnsiteExecutionResponse(onsite); }

        completeIfSettled(order, execution, onsite, tokenUtils.getCurrentProviderId(), RoleName.PROVIDER);

        return executionMapper.toOnsiteExecutionResponse(onsite);
    }

    //cash chi hoan tat khi co du nghiem thu + provider nhan tien; vi provider thieu phi khong chan hoan tat
    public void completeIfSettled(Order order, Execution execution, OnsiteExecution onsite, UUID actorId, RoleName roleName) {

        if (order.getOrderStatus() != OrderStatus.DELIVERED || onsite.getClientAcceptedAt() == null) return;

        if (order.getPaymentMethod() == OrderPaymentMethod.CASH && onsite.getCashReceivedAt() == null) {
            order.setAutoCompleteAt(null);
            orderRepository.save(order);
            return;
        }

        execution.setCompletedAt(clock.instant());
        executionRepository.save(execution);

        orderStatusService.transition(order, OrderStatus.COMPLETED, actorId, roleName);
    }

    public CheckinCodeResponse getCheckinCode(UUID orderId) {

        Order order = loadOrder(orderId);
        assertIsClient(order);
        assertOnsite(order);

        if (order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new AppException(ErrorCode.ORDER_CHECKIN_CODE_NOT_FOUND);
        }

        OnsiteExecution onsite = loadOnsite(loadExecution(orderId).getExecutionId());

        if (onsite.getStatus() != OnsiteExecutionStatus.SCHEDULED
                || onsite.getCheckinCodeEncrypted() == null) {
            throw new AppException(ErrorCode.ORDER_CHECKIN_CODE_NOT_FOUND);
        }

        return CheckinCodeResponse.builder()
                .orderId(orderId)
                .checkinCode(checkinCodeEncryptor.decrypt(onsite.getCheckinCodeEncrypted()))
                .scheduledStart(onsite.getScheduledStart())
                .build();
    }

    private Order lockOrder(UUID orderId) {
        return orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private Order loadOrder(UUID orderId) {
        return orderRepository.findByIdForUpdate(orderId)
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
