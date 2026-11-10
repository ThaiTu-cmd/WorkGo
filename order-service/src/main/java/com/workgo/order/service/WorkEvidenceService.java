package com.workgo.order.service;


import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.WorkEvidenceCreationRequest;
import com.workgo.order.dto.response.WorkEvidenceResponse;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.OnsiteExecution;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.WorkEvidence;
import com.workgo.order.enumeration.EvidencePhase;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OnsiteExecutionStatus;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.WorkEvidenceMapper;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.WorkEvidenceRepository;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class WorkEvidenceService {

    WorkEvidenceRepository workEvidenceRepository;
    WorkEvidenceMapper workEvidenceMapper;
    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    TokenUtils tokenUtils;

    public WorkEvidenceResponse createEvidence(UUID orderId, WorkEvidenceCreationRequest request) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        assertIsProvider(order);

        if (order.getExecutionType() != ExecutionType.ONSITE) {
            throw new AppException(ErrorCode.ORDER_EXECUTION_TYPE_NOT_SUPPORTED);
        }

        if (order.getOrderStatus() != OrderStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.ORDER_EVIDENCE_NOT_ALLOWED);
        }

        if (request.getPhase() == null) {
            throw new AppException(ErrorCode.ORDER_EVIDENCE_PHASE_REQUIRED);
        }

        if (request.getFileUrl() == null || request.getFileUrl().isBlank()) {
            throw new AppException(ErrorCode.ORDER_EVIDENCE_FILE_REQUIRED);
        }

        Execution execution = executionRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        OnsiteExecution onsite = onsiteExecutionRepository
                .findByExecution_ExecutionId(execution.getExecutionId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        if (onsite.getStatus() != OnsiteExecutionStatus.IN_SERVICE) {
            throw new AppException(ErrorCode.ORDER_EVIDENCE_NOT_ALLOWED);
        }

        WorkEvidence evidence = WorkEvidence.builder()
                .phase(request.getPhase())
                .uploadedBy(tokenUtils.getCurrentProviderId())
                .fileUrl(request.getFileUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .capturedAt(request.getCapturedAt() == null ? Instant.now() : request.getCapturedAt())
                .execution(execution)
                .build();

        return workEvidenceMapper.toWorkEvidenceResponse(
                workEvidenceRepository.save(evidence));
    }

    public PageResponse<WorkEvidenceResponse> getEvidences(UUID orderId,
                                                           EvidencePhase phase,
                                                           int page,
                                                           int size) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        tokenUtils.assertParticipant(order);

        if (order.getExecutionType() != ExecutionType.ONSITE) {
            throw new AppException(ErrorCode.ORDER_EXECUTION_TYPE_NOT_SUPPORTED);
        }

        Execution execution = executionRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<WorkEvidence> evidences = null;

        if(phase != null){
            evidences = workEvidenceRepository.findByExecution_ExecutionIdAndPhase(
                    execution.getExecutionId(), phase, pageable);
        } else {
            evidences = workEvidenceRepository.findByExecution_ExecutionId(
                    execution.getExecutionId(), pageable);
        }

        return PageResponse.<WorkEvidenceResponse>builder()
                .totalPages(evidences.getTotalPages())
                .pageSize(evidences.getSize())
                .totalElements(evidences.getTotalElements())
                .currentPage(page)
                .data(evidences.stream()
                        .map(workEvidenceMapper::toWorkEvidenceResponse)
                        .toList())
                .build();
    }

    private void assertIsProvider(Order order) {
        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();

        if (providerId == null || !providerId.equals(order.getProviderId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

}
