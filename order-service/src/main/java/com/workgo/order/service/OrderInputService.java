package com.workgo.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.order.dto.request.*;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.*;
import com.workgo.order.reppository.*;
import com.workgo.order.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class OrderInputService {
    private final OrderRepository orders;
    private final OrderInputChecklistRepository checklists;
    private final OrderAgreementService agreements;
    private final ExecutionRepository executions;
    private final DigitalExecutionRepository digitals;
    private final OrderStatusService statuses;
    private final ObjectMapper json;
    private final TokenUtils tokens;
    private final Clock clock;

    public record StartResult(Instant startedAt, Instant deadline, String blockingReason) {}

    @Transactional
    public OrderInputChecklist get(UUID orderId) {
        Order order=locked(orderId); tokens.assertParticipant(order);
        return current(orderId);
    }

    @Transactional
    public OrderInputChecklist propose(UUID orderId, InputChecklistRequest request) {
        Order order=locked(orderId); provider(order); editable(order);
        var agreement=agreements.currentVersion(order);
        if (!Objects.equals(request.agreementVersion(),agreement.getVersionNo())) conflict();
        var previous=checklists.findTopByOrderIdOrderByChecklistVersionDesc(orderId).orElse(null);
        String requirements=encode(request.requirements());
        if (previous!=null && previous.getClientConfirmedAt()==null) {
            if (previous.getAgreementVersion().equals(request.agreementVersion()) && previous.getRequirements().equals(requirements)) return previous;
        }
        if (previous!=null && previous.getClientConfirmedAt()!=null) conflict();
        Instant now=clock.instant();
        return checklists.saveAndFlush(OrderInputChecklist.builder().orderId(orderId)
                .checklistVersion(previous==null?1:previous.getChecklistVersion()+1)
                .agreementVersion(agreement.getVersionNo()).requirements(requirements)
                .providerConfirmedAt(now).createdAt(now).build());
    }

    @Transactional
    public OrderInputChecklist confirmInputs(UUID orderId, Integer checklistVersion, Long expectedVersion) {
        Order order=locked(orderId); client(order); editableOrStarted(order);
        var row=current(orderId);
        if (Objects.equals(row.getChecklistVersion(),checklistVersion) && row.getClientConfirmedAt()!=null
                && Objects.equals(expectedVersion,row.getConfirmationBaseVersion())) return row;
        expected(row,checklistVersion,expectedVersion);
        if (row.getClientConfirmedAt()!=null) return row;
        editable(order);
        var agreement=agreements.currentVersion(order);
        if (!Objects.equals(agreement.getVersionNo(),row.getAgreementVersion())) conflict();
        Instant now=clock.instant();
        var finalized=agreements.confirmChecklist(order, agreement, row.getRequirements(),row.getProviderConfirmedAt(),now);
        row.setAgreementVersion(finalized.getVersionNo());
        row.setClientConfirmedAt(now); row.setConfirmationBaseVersion(expectedVersion);
        if ("[]".equals(row.getRequirements())) row.setAcceptedAt(now);
        checklists.saveAndFlush(row);
        tryStart(orderId);
        return row;
    }

    @Transactional
    public OrderInputChecklist submit(UUID orderId, InputSubmissionRequest request) {
        Order order=locked(orderId); client(order); editable(order);
        var row=current(orderId); expected(row,request.checklistVersion(),request.expectedVersion());
        submitValues(order,row,request.values());
        return row;
    }

    // Existing /requirements route now submits for Provider review, never starts a timer.
    @Transactional
    public void submitLegacy(UUID orderId, RequirementSubmissionRequest request) {
        Order order=locked(orderId); client(order); editable(order);
        if (request==null || request.getChecklistVersion()==null || request.getExpectedVersion()==null) conflict();
        var row=current(orderId); expected(row,request.getChecklistVersion(),request.getExpectedVersion());
        submitValues(order,row,request.getValues());
    }

    private void submitValues(Order order, OrderInputChecklist row, Object values) {
        if (row.getResponseDueAt()!=null) invalid();
        if (row.getClientConfirmedAt()==null || row.getAcceptedAt()!=null || values==null
                || !(values instanceof Map<?,?> map) || map.isEmpty()) invalid();
        row.setSubmittedValues(encode(values));
        row.setSubmittedAt(clock.instant()); row.setResponseDueAt(clock.instant().plus(Duration.ofHours(24)));
        row.setMissingReason(null); checklists.saveAndFlush(row);
    }

    @Transactional
    public OrderInputChecklist review(UUID orderId, InputReviewRequest request) {
        Order order=locked(orderId); provider(order); editable(order);
        var row=current(orderId); expected(row,request.checklistVersion(),request.expectedVersion());
        if (row.getClientConfirmedAt()==null || row.getSubmittedAt()==null || row.getAcceptedAt()!=null) invalid();
        if (Boolean.TRUE.equals(request.sufficient())) row.setAcceptedAt(clock.instant());
        else {
            if (request.missingReason()==null || request.missingReason().isBlank()) invalid();
            row.setMissingReason(request.missingReason());
            // The next client submission, rather than this response, opens a new Provider SLA.
        }
        row.setResponseDueAt(null);
        if (row.getAcceptedAt()!=null) { order.setInputSupportReason(null); orders.save(order); }
        checklists.saveAndFlush(row); tryStart(orderId); return row;
    }

    @Transactional
    public StartResult tryStart(UUID orderId) {
        Order order=locked(orderId);
        Execution execution=executions.findByOrder_OrderId(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));
        var digital=order.getExecutionType()==ExecutionType.DIGITAL
                ? digitals.findByExecution_ExecutionId(execution.getExecutionId()).orElseThrow(()->new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND)):null;
        if (execution.getStartedAt()!=null) return new StartResult(execution.getStartedAt(),digital==null?null:digital.getDeadlineAt(),null);
        String reason=blockingReason(order);
        if (reason!=null) return new StartResult(null,null,reason);
        if (order.getExecutionType()==ExecutionType.ONSITE) return new StartResult(null,null,"VALID_CHECKIN_REQUIRED");
        var agreement=agreements.currentVersion(order);
        if (agreement.getDurationDays()==null || agreement.getDurationDays()<=0) return new StartResult(null,null,"DURATION_REQUIRED");
        Instant now=clock.instant();
        execution.setStartedAt(now); executions.save(execution);
        digital.setRequirementSubmittedAt(current(orderId).getAcceptedAt());
        digital.setDeadlineAt(now.plus(Duration.ofDays(agreement.getDurationDays())));
        digital.setStatus(DigitalExecutionStatus.WORKING); digitals.save(digital);
        statuses.transition(order,OrderStatus.IN_PROGRESS,null,RoleName.SYSTEM);
        order.setStartedAt(now); orders.save(order);
        return new StartResult(now,digital.getDeadlineAt(),null);
    }

    public String blockingReason(Order order) {
        if (order.getOrderStatus()!=OrderStatus.CONFIRMED) return "ORDER_NOT_CONFIRMED";
        if (order.getPaymentMethod()==OrderPaymentMethod.WALLET && (order.getPaymentStatus()!=PaymentStatus.SUCCEEDED || order.getPaymentId()==null)) return "WALLET_HOLD_REQUIRED";
        if (order.getPaymentMethod()==OrderPaymentMethod.CASH && (order.getExecutionType()!=ExecutionType.ONSITE || order.getPaymentStatus()!=PaymentStatus.CASH_ON_SITE)) return "INVALID_CASH_PAYMENT";
        if (order.getPaymentMethod()==null) return "PAYMENT_METHOD_REQUIRED";
        var agreement=agreements.currentVersion(order);
        if (agreement.getProviderConfirmedAt()==null || agreement.getClientConfirmedAt()==null || agreement.getInputRequirements()==null) return "AGREEMENT_CONFIRMATION_REQUIRED";
        if (order.getExecutionType()==ExecutionType.ONSITE && (agreement.getScheduleStart()==null || agreement.getScheduleEnd()==null
                || agreement.getAddress()==null || agreement.getAddress().isBlank())) return "ONSITE_SCHEDULE_REQUIRED";
        var row=checklists.findTopByOrderIdOrderByChecklistVersionDesc(order.getOrderId()).orElse(null);
        if (row==null || row.getClientConfirmedAt()==null || !Objects.equals(row.getRequirements(),agreement.getInputRequirements())) return "CHECKLIST_CONFIRMATION_REQUIRED";
        if (row.getAcceptedAt()==null) return "INPUTS_NOT_CONFIRMED";
        return null;
    }

    private Order locked(UUID id) { return orders.findByIdForUpdate(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND)); }
    private OrderInputChecklist current(UUID id) { return checklists.findTopByOrderIdOrderByChecklistVersionDesc(id).orElseThrow(()->new AppException(ErrorCode.ORDER_INPUTS_REQUIRED)); }
    private void client(Order o) { if (!tokens.hasRole("ROLE_CLIENT") || !Objects.equals(tokens.getCurrentUserId(),o.getClientId())) throw new AppException(ErrorCode.FORBIDDEN); }
    private void provider(Order o) { if (!tokens.hasRole("ROLE_PROVIDER") || !Objects.equals(tokens.getCurrentProviderId(),o.getProviderId())) throw new AppException(ErrorCode.FORBIDDEN); }
    private void editable(Order o) { if (o.getOrderStatus()!=OrderStatus.CONFIRMED && o.getOrderStatus()!=OrderStatus.PENDING_PAYMENT) throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION); }
    private void editableOrStarted(Order o) { if (o.getOrderStatus()!=OrderStatus.IN_PROGRESS) editable(o); }
    private void expected(OrderInputChecklist r,Integer v,Long e) { if (!Objects.equals(r.getChecklistVersion(),v) || e==null || !Objects.equals(r.getVersion(),e)) conflict(); }
    private String encode(Object o) { try { return json.writeValueAsString(o); } catch (JsonProcessingException e) { throw new AppException(ErrorCode.INVALID_REQUEST_BODY); } }
    private void conflict() { throw new AppException(ErrorCode.ORDER_INPUTS_STALE); }
    private void invalid() { throw new AppException(ErrorCode.ORDER_INPUTS_INVALID); }
}
