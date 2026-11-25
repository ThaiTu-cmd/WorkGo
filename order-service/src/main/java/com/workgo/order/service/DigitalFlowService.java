package com.workgo.order.service;

import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.DeliverySubmissionRequest;
import com.workgo.order.dto.request.RequirementSubmissionRequest;
import com.workgo.order.dto.request.RevisionRequestCreationRequest;
import com.workgo.order.dto.response.DeliveryPackageResponse;
import com.workgo.order.dto.response.DigitalExecutionResponse;
import com.workgo.order.dto.response.RevisionRequestResponse;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.DeliveryPackageMapper;
import com.workgo.order.mapper.ExecutionMapper;
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
    ExecutionMapper executionMapper;
    TokenUtils tokenUtils;
    OrderFileService orderFileService;
    OrderAgreementService orderAgreementService;
    OrderInputService orderInputService;
    java.time.Clock clock;

    @Transactional
    public void submitRequirements(UUID orderId, RequirementSubmissionRequest request) {

        orderInputService.submitLegacy(orderId, request);
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

        if (request == null || request.getFiles() == null || request.getFiles().isEmpty()
                || request.getFiles().stream().anyMatch(java.util.Objects::isNull)) {
            throw new AppException(ErrorCode.ORDER_DELIVERY_FILE_REQUIRED);
        }

        Execution execution = loadExecution(orderId);
        DigitalExecution digital = loadDigital(execution.getExecutionId());

        //dam bao la khi nop delivery thi no khong duoc trong qua trinh lam hay xem xet
        if (digital.getStatus() != DigitalExecutionStatus.WORKING
                && digital.getStatus() != DigitalExecutionStatus.REVISING) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        if (digital.getStatus() == DigitalExecutionStatus.REVISING
                && currentRevision(execution).filter(r -> r.getStatus() == RevisionStatus.AGREED).isEmpty())
            throw new AppException(ErrorCode.ORDER_REVISION_DEADLINE_REQUIRED);
        int versionNo = (int) deliveryPackageRepository
                .countByExecution_ExecutionId(execution.getExecutionId()) + 1;

        Instant now = clock.instant();

        DeliveryPackage deliveryPackage = DeliveryPackage.builder()
                .execution(execution)
                .versionNo(versionNo)
                .message(request.getMessage())
                .status(DeliveryPackageStatus.SUBMITTED)
                .deliveredAt(now)
                .build();

        List<DeliveryFile> files = request.getFiles().stream()
                .map(file -> orderFileService.loadOwnFile(orderId, file.getFileId(), FileContext.DELIVERY))
                .map(storedFile -> DeliveryFile.builder()
                        .deliveryPackage(deliveryPackage)
                        .storedFileId(storedFile.getStoredFileId())
                        .fileName(storedFile.getOriginalName())
                        .mimeType(storedFile.getMimeType())
                        .sizeBytes(storedFile.getSizeBytes())
                        .fileHash(storedFile.getSha256())
                        .build())
                .toList();

        deliveryPackage.setFiles(files);
        deliveryPackageRepository.save(deliveryPackage);

        // Every submission is a new immutable version; only close the current agreed repair.
        currentRevision(execution).ifPresent(revision -> {
            if (revision.getStatus() != RevisionStatus.AGREED)
                throw new AppException(ErrorCode.ORDER_REVISION_DEADLINE_REQUIRED);
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

        Order order = orderRepository.findById(orderId).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
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


        DeliveryPackage deliveryPackage = deliveryPackageRepository
                .findFirstByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_DELIVERY_NOT_FOUND));

        if (deliveryPackage.getStatus() != DeliveryPackageStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        OrderAgreementVersion agreement = orderAgreementService.currentVersion(order);
        if (request == null || !java.util.Objects.equals(request.getDeliveryVersion(), deliveryPackage.getVersionNo())
                || !java.util.Objects.equals(request.getAgreementVersion(), agreement.getVersionNo()))
            throw new AppException(ErrorCode.ORDER_REVISION_STALE);
        if (Boolean.TRUE.equals(request.getScopeChange()) || request.getReason() == null || request.getReason().isBlank()
                || request.getReason().length() > 10000 || request.getCriterionRefs() == null || request.getCriterionRefs().isEmpty()
                || request.getCriterionRefs().size() > 2
                || request.getCriterionRefs().stream().anyMatch(ref ->
                    !("scope".equals(ref) && agreement.getScope() != null && !agreement.getScope().isBlank())
                    && !("acceptanceCriteria".equals(ref) && agreement.getAcceptanceCriteria() != null && !agreement.getAcceptanceCriteria().isBlank())))
            throw new AppException(ErrorCode.ORDER_REVISION_INVALID);
        Instant now = clock.instant();

        deliveryPackage.setStatus(DeliveryPackageStatus.REVISION_REQUESTED);
        deliveryPackageRepository.save(deliveryPackage);

        //tao phan yeu cau xem xet
        RevisionRequest revision = RevisionRequest.builder()
                .deliveryPackage(deliveryPackage)
                .requestedBy(tokenUtils.getCurrentUserId())
                .reason(request.getReason().trim())
                .deliveryVersion(deliveryPackage.getVersionNo())
                .agreementVersion(agreement.getVersionNo())
                .criterionRefs(new java.util.ArrayList<>(request.getCriterionRefs().stream().distinct().toList()))
                .scopeSnapshot(agreement.getScope()).criteriaSnapshot(agreement.getAcceptanceCriteria())
                .createdAt(now).responseDueAt(now.plus(Duration.ofHours(24)))
                .deadlineAgreementDueAt(now.plus(Duration.ofHours(48)))
                .status(RevisionStatus.OPEN)
                .build();

        revisionRequestRepository.save(revision);

        digital.setRevisionsUsed(digital.getRevisionsUsed() + 1);
        digital.setStatus(DigitalExecutionStatus.REVISING);
        digitalExecutionRepository.save(digital);

        order.setAutoCompleteAt(null);

        orderStatusService.transition(order, OrderStatus.IN_PROGRESS,
                tokenUtils.getCurrentUserId(), RoleName.CLIENT);

        return revisionResponse(revision, execution);
    }


    @Transactional(readOnly = true)
    public List<RevisionRequestResponse> getRevisions(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        tokenUtils.assertParticipant(order);
        assertDigital(order);

        Execution execution = loadExecution(orderId);

        return revisionRequestRepository
                .findByDeliveryPackage_Execution_ExecutionIdOrderByCreatedAtDesc(
                        execution.getExecutionId())
                .stream()
                .map(revision -> revisionResponse(revision, execution))
                .toList();
    }


    //Client chap nhan order sau khi provider gui
    @Transactional
    public DigitalExecutionResponse acceptDelivery(UUID orderId) {

        Order order = loadOrder(orderId);
        assertIsClient(order);
        assertDigital(order);

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Execution execution = loadExecution(orderId);
        DigitalExecution digital = loadDigital(execution.getExecutionId());

        if (digital.getStatus() != DigitalExecutionStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        DeliveryPackage deliveryPackage = deliveryPackageRepository
                .findFirstByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_DELIVERY_NOT_FOUND));

        if (deliveryPackage.getStatus() != DeliveryPackageStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Instant now = clock.instant();


        //luu lai tien do
        deliveryPackage.setStatus(DeliveryPackageStatus.ACCEPTED);
        deliveryPackageRepository.save(deliveryPackage);

        digital.setStatus(DigitalExecutionStatus.ACCEPT);
        digitalExecutionRepository.save(digital);

        execution.setCompletedAt(now);
        executionRepository.save(execution);

        orderStatusService.transition(order, OrderStatus.COMPLETED,
                tokenUtils.getCurrentUserId(), RoleName.CLIENT);

        return executionMapper.toDigitalExecutionResponse(digital);
    }

    @Transactional(readOnly = true)
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public org.springframework.data.domain.Page<RevisionSupportItem> revisionSupportQueue(int page, int size) {
        return revisionRequestRepository.findSupportQueue(clock.instant(), PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, size))))
                .map(r -> new RevisionSupportItem(r.getDeliveryPackage().getExecution().getOrder().getOrderId(),
                        r.getRevisionRequestId(), r.getDeliveryVersion(), r.getReason(), r.getResponseDueAt(),
                        r.getDeadlineAgreementDueAt(), r.getStatus()));
    }
    public record RevisionSupportItem(UUID orderId, UUID revisionRequestId, Integer deliveryVersion, String reason,
            Instant responseDueAt, Instant deadlineAgreementDueAt, RevisionStatus status) {}

    private java.util.Optional<RevisionRequest> currentRevision(Execution execution) {
        return revisionRequestRepository.findByDeliveryPackage_Execution_ExecutionIdOrderByCreatedAtDesc(execution.getExecutionId())
                .stream().filter(r -> r.getStatus() == RevisionStatus.OPEN || r.getStatus() == RevisionStatus.RESPONDED
                        || r.getStatus() == RevisionStatus.AGREED).findFirst();
    }

    private RevisionRequestResponse revisionResponse(RevisionRequest revision, Execution execution) {
        RevisionRequestResponse response = revisionRequestMapper.toResponse(revision);
        if (response == null) return null;
        List<RevisionRequest> history = revisionRequestRepository
                .findByDeliveryPackage_Execution_ExecutionIdOrderByCreatedAtDesc(execution.getExecutionId());
        Instant first = history.stream().map(RevisionRequest::getCreatedAt).filter(java.util.Objects::nonNull)
                .min(Instant::compareTo).orElse(revision.getCreatedAt());
        response.setAdminSuggested(history.size() >= 3 || (first != null && !clock.instant().isBefore(first.plus(Duration.ofDays(7)))));
        response.setSupportRequired(revision.getStatus() != RevisionStatus.RESOLVED && revision.getStatus() != RevisionStatus.REJECTED
                && ((revision.getRespondedAt() == null && revision.getResponseDueAt() != null && !clock.instant().isBefore(revision.getResponseDueAt()))
                || (revision.getAgreedRepairDeadline() == null && revision.getDeadlineAgreementDueAt() != null && !clock.instant().isBefore(revision.getDeadlineAgreementDueAt()))));
        return response;
    }

    @Transactional
    public RevisionRequestResponse respondRevision(UUID orderId, UUID revisionId,
            com.workgo.order.dto.request.RevisionResponseRequest request) {
        Order order = loadOrder(orderId);
        assertIsProvider(order);
        RevisionRequest revision = activeRevision(order, revisionId);
        if (request == null || request.response() == null || request.response().isBlank() || request.response().length() > 10000
                || request.proposedRepairDeadline() == null || !request.proposedRepairDeadline().isAfter(clock.instant()))
            throw new AppException(ErrorCode.ORDER_REVISION_INVALID);
        if (revision.getStatus() != RevisionStatus.OPEN && revision.getStatus() != RevisionStatus.RESPONDED) throw new AppException(ErrorCode.ORDER_REVISION_STALE);
        revision.setProviderResponse(request.response().trim());
        revision.setProposedRepairDeadline(request.proposedRepairDeadline());
        if (revision.getRespondedAt() == null) revision.setRespondedAt(clock.instant());
        revision.setStatus(RevisionStatus.RESPONDED);
        revisionRequestRepository.save(revision);
        return revisionResponse(revision, revision.getDeliveryPackage().getExecution());
    }

    @Transactional
    public RevisionRequestResponse confirmRepairDeadline(UUID orderId, UUID revisionId,
            com.workgo.order.dto.request.RevisionDeadlineConfirmationRequest request) {
        Order order = loadOrder(orderId);
        assertIsClient(order);
        RevisionRequest revision = activeRevision(order, revisionId);
        if (request == null || !java.util.Objects.equals(request.proposedRepairDeadline(), revision.getProposedRepairDeadline()))
            throw new AppException(ErrorCode.ORDER_REVISION_STALE);
        if (revision.getStatus() == RevisionStatus.AGREED) return revisionResponse(revision, revision.getDeliveryPackage().getExecution());
        if (revision.getStatus() != RevisionStatus.RESPONDED || revision.getProposedRepairDeadline() == null
                || !revision.getProposedRepairDeadline().isAfter(clock.instant()))
            throw new AppException(ErrorCode.ORDER_REVISION_STALE);
        revision.setAgreedRepairDeadline(revision.getProposedRepairDeadline());
        revision.setDeadlineAgreedAt(clock.instant());
        revision.setStatus(RevisionStatus.AGREED);
        revisionRequestRepository.save(revision);
        DigitalExecution digital = loadDigital(revision.getDeliveryPackage().getExecution().getExecutionId());
        digital.setDeadlineAt(revision.getAgreedRepairDeadline());
        digitalExecutionRepository.save(digital);
        return revisionResponse(revision, revision.getDeliveryPackage().getExecution());
    }

    private RevisionRequest activeRevision(Order order, UUID revisionId) {
        assertDigital(order);
        if (order.getOrderStatus() != OrderStatus.IN_PROGRESS)
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        Execution execution = loadExecution(order.getOrderId());
        return currentRevision(execution).filter(r -> r.getRevisionRequestId().equals(revisionId))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_REVISION_NOT_FOUND));
    }

    //=====================================

    private Order loadOrder(UUID orderId) {
        return orderRepository.findByIdForUpdate(orderId)
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

        if (!tokenUtils.hasRole("ROLE_PROVIDER") || providerId == null || !providerId.equals(order.getProviderId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void assertIsClient(Order order) {
        if (!tokenUtils.hasRole("ROLE_CLIENT") || !tokenUtils.getCurrentUserId().equals(order.getClientId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

}
