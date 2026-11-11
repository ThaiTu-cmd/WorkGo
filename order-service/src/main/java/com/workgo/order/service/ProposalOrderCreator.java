package com.workgo.order.service;

import com.workgo.order.dto.request.CreateProposalOrderRequest;
import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.ProposalOrderResponse;
import com.workgo.order.dto.response.client.AcceptedProposalResponse;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.dto.snapshot.*;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.JobClient;
import com.workgo.order.service.handler.DigitalExecutionHandler;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProposalOrderCreator {
    private final OrderRepository orders;
    private final OrderSnapshotRepository snapshots;
    private final OrderItemRepository items;
    private final JobClient jobClient;
    private final OrderStatusService statusService;
    private final DigitalExecutionHandler digitalHandler;
    @Value("${order.platform-fee-rate}")
    private BigDecimal feeRate;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ProposalOrderService.CreationResult create(CreateProposalOrderRequest request) {
        var existing = replay(request);
        if (existing != null) return existing;
        if (orders.existsProposalSourceIncludingDeleted(request.proposalId())) {
            // READ COMMITTED permits a winner to commit between the first read and this check.
            var winner = replay(request);
            if (winner != null) return winner;
            throw new AppException(ErrorCode.PROPOSAL_ORDER_CONFLICT);
        }
        AcceptedProposalResponse source;
        try {
            source = jobClient.getProposal(request.proposalId());
        } catch (FeignException ex) {
            throw new AppException(ex.status() == 404 || ex.status() == 410
                    ? ErrorCode.PROPOSAL_ORDER_CONFLICT : ErrorCode.JOB_SERVICE_UNAVAILABLE);
        } catch (IllegalStateException ex) {
            throw new AppException(ErrorCode.JOB_SERVICE_UNAVAILABLE);
        }
        ProposalSnapshot frozen = ProposalSnapshot.from(request);
        if (source == null || !"ACCEPTED".equals(source.proposalStatus()) || !"CLOSED".equals(source.jobStatus())
                || !"ACCEPTED".equals(source.applicationStatus()) || !frozen.equals(source.snapshot())) {
            throw new AppException(ErrorCode.PROPOSAL_ORDER_CONFLICT);
        }
        BigDecimal fee = request.price().multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = request.price().subtract(fee);
        Order order = orders.saveAndFlush(Order.builder()
                .orderNumber("WG-P-" + UUID.randomUUID())
                .sourceType(SourceType.PROPOSAL).sourceId(request.proposalId())
                .clientId(request.clientId()).providerId(request.providerId())
                .executionType(ExecutionType.DIGITAL).title(request.jobTitle())
                .subtotal(request.price()).platformFee(fee).totalAmount(request.price()).providerNetAmount(net)
                .currency(request.currency()).orderStatus(OrderStatus.PENDING_PAYMENT).paymentStatus(PaymentStatus.PENDING)
                .placedAt(Instant.now()).build());
        items.save(OrderItem.builder().order(order).referenceId(request.proposalId()).itemType(ItemType.PROPOSAL)
                .name(request.jobTitle()).quantity(1).unitPrice(request.price()).amount(request.price()).sortOrder(0).build());

        // Reuse the existing DIGITAL lifecycle; no catalog package is purchased here.
        digitalHandler.create(order, new OrderCreationRequest(), PackageResponse.builder().revisionLimit(0).build());
        snapshots.save(OrderSnapshot.builder().order(order).proposalSnapshot(frozen)
                .pricingSnapshot(PricingSnapshot.builder().subtotal(request.price()).platformFee(fee)
                        .totalAmount(request.price()).providerNetAmount(net).platformFeeRate(feeRate).currency(request.currency()).build())
                .providerSnapshot(ProviderSnapshot.builder().providerId(request.providerId()).build())
                .addOnSnapshot(List.of())
                .executionSnapshot(ExecutionSnapshot.builder().executionType(ExecutionType.DIGITAL).autoCompleteHours(72).build())
                .build());
        statusService.recordCreated(order, request.clientId());
        return result(order, frozen, true);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public ProposalOrderService.CreationResult replay(CreateProposalOrderRequest request) {
        Order order = orders.findBySourceTypeAndSourceId(SourceType.PROPOSAL, request.proposalId()).orElse(null);
        if (order == null) return null;
        ProposalSnapshot frozen = snapshots.findById(order.getOrderId()).map(OrderSnapshot::getProposalSnapshot).orElse(null);
        if (!ProposalSnapshot.from(request).equals(frozen)) throw new AppException(ErrorCode.PROPOSAL_ORDER_CONFLICT);
        return result(order, frozen, false);
    }

    private ProposalOrderService.CreationResult result(Order order, ProposalSnapshot snapshot, boolean created) {
        return new ProposalOrderService.CreationResult(new ProposalOrderResponse(order.getOrderId(), snapshot.proposalId(),
                snapshot.jobId(), order.getSourceType().name(), order.getOrderStatus().name()), created);
    }
}
