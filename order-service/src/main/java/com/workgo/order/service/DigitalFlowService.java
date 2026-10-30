package com.workgo.order.service;

import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.DeliverySubmissionRequest;
import com.workgo.order.dto.request.RequirementSubmissionRequest;
import com.workgo.order.dto.request.RevisionRequestCreationRequest;
import com.workgo.order.dto.response.DeliveryPackageResponse;
import com.workgo.order.dto.response.RevisionRequestResponse;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.DeliveryPackageMapper;
import com.workgo.order.mapper.RevisionRequestMapper;
import com.workgo.order.reppository.*;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class DigitalFlowService {


    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    OrderSnapshotRepository orderSnapshotRepository;
    DeliveryPackageRepository deliveryPackageRepository;
    RevisionRequestRepository revisionRequestRepository;
    OrderStatusService orderStatusService;
    DeliveryPackageMapper deliveryPackageMapper;
    RevisionRequestMapper revisionRequestMapper;
    TokenUtils tokenUtils;

    @Transactional
    public void submitRequirements(UUID orderId, RequirementSubmissionRequest request) {

        Order order = loadOrder(orderId);
        assertIsClient(order);
        assertDigital(order);

        //dam bao order da duoc confirm de nop duoc package
        if (order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        DigitalExecution digital = loadDigital(execution.getExecutionId());

        if (digital.getRequirementSubmittedAt() != null) {
            throw new AppException(ErrorCode.ORDER_REQUIREMENTS_SUBMITTED);
        }

        OrderSnapshot snapshot = orderSnapshotRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Instant now = Instant.now();

        if (snapshot.getPackageSnapshot() != null
                && snapshot.getPackageSnapshot().getDeliveryDay() != null) {
            digital.setDeadlineAt(now.plus(Duration.ofDays(
                    snapshot.getPackageSnapshot().getDeliveryDay())));
        }


        //tien hanh luu trang thai
        snapshot.setRequirementValues(request.getValues());
        orderSnapshotRepository.save(snapshot);

        digital.setRequirementSubmittedAt(now);
        digital.setStatus(DigitalExecutionStatus.WORKING);
        digitalExecutionRepository.save(digital);

        execution.setStartedAt(now);
        executionRepository.save(execution);

        orderStatusService.transition(order, OrderStatus.IN_PROGRESS,
                tokenUtils.getCurrentUserId(), RoleName.CLIENT);
    }

    @Transactional
    public DeliveryPackageResponse submitDelivery(UUID orderId, DeliverySubmissionRequest request) {

        Order order = loadOrder(orderId);
        assertIsProvider(order);
        assertDigital(order);

        //dam bao order o trang thai dang trong tien trinh
        if (order.getOrderStatus() != OrderStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        if (request.getFiles() == null || request.getFiles().isEmpty()) {
            throw new AppException(ErrorCode.ORDER_DELIVERY_FILE_REQUIRED);
        }

        Execution execution = loadExecution(orderId);
        DigitalExecution digital = loadDigital(execution.getExecutionId());

        //dam bao la khi nop delivery thi no khong duoc trong qua trinh lam hay xem xet
        if (digital.getStatus() != DigitalExecutionStatus.WORKING
                && digital.getStatus() != DigitalExecutionStatus.REVISING) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        int versionNo = (int) deliveryPackageRepository
                .countByExecution_ExecutionId(execution.getExecutionId()) + 1;

        Instant now = Instant.now();

        DeliveryPackage deliveryPackage = DeliveryPackage.builder()
                .execution(execution)
                .versionNo(versionNo)
                .message(request.getMessage())
                .status(DeliveryPackageStatus.SUBMITTED)
                .deliveredAt(now)
                .build();

        List<DeliveryFile> files = request.getFiles().stream()
                .map(file -> DeliveryFile.builder()
                        .deliveryPackage(deliveryPackage)
                        .fileUrl(file.getFileUrl())
                        .fileName(file.getFileName())
                        .mimeType(file.getMimeType())
                        .sizeBytes(file.getSizeBytes())
                        .fileHash(file.getFileHash())
                        .build())
                .toList();

        deliveryPackage.setFiles(files);
        deliveryPackageRepository.save(deliveryPackage);

        //dong revision dang mo cua lan nop truoc
        revisionRequestRepository.findFirstByDeliveryPackage_Execution_ExecutionIdAndStatusOrderByCreatedAtDesc(
                        execution.getExecutionId(), RevisionStatus.OPEN)
                .ifPresent(revision -> {
                    revision.setStatus(RevisionStatus.RESOLVED);
                    revision.setResolvedAt(now);
                    revisionRequestRepository.save(revision);
                });


        //luu tien do
        digital.setStatus(DigitalExecutionStatus.SUBMITTED);
        digitalExecutionRepository.save(digital);

        execution.setDeliveredAt(now);
        executionRepository.save(execution);

        order.setAutoCompleteAt(now.plus(Duration.ofHours(72)));

        orderStatusService.transition(order, OrderStatus.DELIVERED,
                tokenUtils.getCurrentProviderId(), RoleName.PROVIDER);

        return deliveryPackageMapper.toResponse(deliveryPackage);
    }


    @Transactional(readOnly = true)
    public List<DeliveryPackageResponse> getDeliveryPackage(UUID orderId) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        assertDigital(order);

        Execution execution = loadExecution(orderId);

        return deliveryPackageRepository
                .findByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId())
                .stream()
                .map(deliveryPackageMapper::toResponse)
                .toList();
    }

    //tao phan xem xet lai package, viec lam
    @Transactional
    public RevisionRequestResponse requestRevision(UUID orderId,
                                                   RevisionRequestCreationRequest request) {

        Order order = loadOrder(orderId);
        assertIsClient(order);
        assertDigital(order);

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        DigitalExecution digital = loadDigital(execution.getExecutionId());

        if (digital.getRevisionLimit() != null
                && digital.getRevisionsUsed() >= digital.getRevisionLimit()) {
            throw new AppException(ErrorCode.ORDER_REVISION_LIMIT_EXCEEDED);
        }

        DeliveryPackage deliveryPackage = deliveryPackageRepository
                .findFirstByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_DELIVERY_NOT_FOUND));

        if (deliveryPackage.getStatus() != DeliveryPackageStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();

        deliveryPackage.setStatus(DeliveryPackageStatus.REVISION_REQUESTED);
        deliveryPackageRepository.save(deliveryPackage);

        //tao phan yeu cau xem xet
        RevisionRequest revision = RevisionRequest.builder()
                .deliveryPackage(deliveryPackage)
                .requestedBy(tokenUtils.getCurrentUserId())
                .reason(request.getReason())
                .status(RevisionStatus.OPEN)
                .build();

        revisionRequestRepository.save(revision);

        digital.setRevisionsUsed(digital.getRevisionsUsed() + 1);
        digital.setStatus(DigitalExecutionStatus.WORKING);
        digitalExecutionRepository.save(digital);

        order.setAutoCompleteAt(null);

        orderStatusService.transition(order, OrderStatus.IN_PROGRESS,
                tokenUtils.getCurrentUserId(), RoleName.CLIENT);

        return revisionRequestMapper.toResponse(revision);
    }


    @Transactional(readOnly = true)
    public List<RevisionRequestResponse> getRevisions(UUID orderId) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        assertDigital(order);

        Execution execution = loadExecution(orderId);

        return revisionRequestRepository
                .findByDeliveryPackage_Execution_ExecutionIdOrderByCreatedAtDesc(
                        execution.getExecutionId())
                .stream()
                .map(revisionRequestMapper::toResponse)
                .toList();
    }

    //=====================================

    private Order loadOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private Execution loadExecution(UUID orderId) {
        return executionRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));
    }

    private DigitalExecution loadDigital(UUID executionId) {
        return digitalExecutionRepository.findByExecution_ExecutionId(executionId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));
    }

    private void assertDigital(Order order) {
        if (order.getExecutionType() != ExecutionType.DIGITAL) {
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
