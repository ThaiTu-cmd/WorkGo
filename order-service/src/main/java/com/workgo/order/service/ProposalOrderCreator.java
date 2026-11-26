package com.workgo.order.service;

import com.workgo.order.dto.request.CreateProposalOrderRequest;
import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.ProposalOrderResponse;
import com.workgo.order.dto.response.client.AcceptedProposalResponse;
import com.workgo.order.dto.response.client.FeePolicyResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProposalOrderCreator {
    private final OrderRepository orders;
    private final OrderSnapshotRepository snapshots;
    private final OrderItemRepository items;
    private final JobClient jobClient;
    private final OrderStatusService statusService;
    private final DigitalExecutionHandler digitalHandler;
    private final OrderFeeService orderFeeService;
    private final ProviderFinancialEligibility providerFinancialEligibility;
    private final OrderRewardQuoteService rewardQuotes;
    private final OrderAgreementVersionRepository agreementVersions;

    public ProposalOrderCreator(OrderRepository orders,
                                OrderSnapshotRepository snapshots,
                                OrderItemRepository items,
                                JobClient jobClient,
                                OrderStatusService statusService,
                                DigitalExecutionHandler digitalHandler,
                                OrderFeeService orderFeeService,
                                ProviderFinancialEligibility providerFinancialEligibility,
                                OrderRewardQuoteService rewardQuotes) {
        this(orders, snapshots, items, jobClient, statusService, digitalHandler, orderFeeService,
                providerFinancialEligibility, rewardQuotes, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ProposalOrderCreator(OrderRepository orders,
                                OrderSnapshotRepository snapshots,
                                OrderItemRepository items,
                                JobClient jobClient,
                                OrderStatusService statusService,
                                DigitalExecutionHandler digitalHandler,
                                OrderFeeService orderFeeService,
                                ProviderFinancialEligibility providerFinancialEligibility,
                                OrderRewardQuoteService rewardQuotes,
                                OrderAgreementVersionRepository agreementVersions) {
        this.orders = orders;
        this.snapshots = snapshots;
        this.items = items;
        this.jobClient = jobClient;
        this.statusService = statusService;
        this.digitalHandler = digitalHandler;
        this.orderFeeService = orderFeeService;
        this.providerFinancialEligibility = providerFinancialEligibility;
        this.rewardQuotes = rewardQuotes;
        this.agreementVersions = agreementVersions;
    }

    public OrderRewardQuoteService.Quote preview(CreateProposalOrderRequest request){
        var policy=orderFeeService.currentPolicy();return rewardQuotes.preview(proposalQuoteInput(request,policy.getFeePolicyVersionId()));
    }
    public OrderRewardQuoteService.Quote checkQuote(CreateProposalOrderRequest request){
        var policy=orderFeeService.currentPolicy();var input=proposalQuoteInput(request,policy.getFeePolicyVersionId());
        rewardQuotes.referenceAt(input,request.rewardQuoteRef(),request.acceptedAt());return rewardQuotes.historic(request.rewardQuoteRef());
    }
    private OrderRewardQuoteService.Input proposalQuoteInput(CreateProposalOrderRequest r,UUID policy){return new OrderRewardQuoteService.Input(r.clientId(),r.providerId(),"PROPOSAL",r.proposalId(),r.jobTitle()+(r.jobDescription()==null||r.jobDescription().isBlank()?"":"\n"+r.jobDescription()),r.price(),r.currency(),r.estimatedDays(),policy);}

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ProposalOrderService.CreationResult create(CreateProposalOrderRequest request) {
        if ((request.currency() == null || "VND".equalsIgnoreCase(request.currency()))
                && request.price() != null && request.price().stripTrailingZeros().scale() > 0) {
            throw new AppException(ErrorCode.PROPOSAL_ORDER_INVALID_REQUEST);
        }
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
                || !"ACCEPTED".equals(source.applicationStatus()) || !frozen.equals(source.snapshot())||!java.util.Objects.equals(request.rewardQuoteRef(),source.rewardQuoteRef())||!java.util.Objects.equals(request.acceptedAt(),source.acceptedAt())) {
            throw new AppException(ErrorCode.PROPOSAL_ORDER_CONFLICT);
        }
        providerFinancialEligibility.assertMayStartNewWork(request.providerId());
        FeePolicyResponse feePolicy=request.rewardQuoteRef()==null?orderFeeService.currentPolicy():orderFeeService.version(rewardQuotes.historic(request.rewardQuoteRef()).input().feePolicyVersionId());
        BigDecimal fee = orderFeeService.successFee(request.price(), feePolicy.getSuccessFeeRate());
        BigDecimal net = request.price().subtract(fee);
        String rewardQuoteRef=request.rewardQuoteRef()==null?rewardQuotes.quote(proposalQuoteInput(request,feePolicy.getFeePolicyVersionId())):
                rewardQuotes.referenceAt(proposalQuoteInput(request,feePolicy.getFeePolicyVersionId()),request.rewardQuoteRef(),request.acceptedAt());
        Instant placedAt = request.acceptedAt()==null?Instant.now():request.acceptedAt();
        Order order = orders.saveAndFlush(Order.builder()
                .recoveryGrantId(providerFinancialEligibility.recoveryGrant(request.providerId()))
                .orderNumber("WG-P-" + UUID.randomUUID())
                .sourceType(SourceType.PROPOSAL).sourceId(request.proposalId())
                .clientId(request.clientId()).providerId(request.providerId())
                .executionType(ExecutionType.DIGITAL).title(request.jobTitle())
                .subtotal(request.price()).platformFee(fee).totalAmount(request.price()).providerNetAmount(net)
                .currency(request.currency()).orderStatus(OrderStatus.PENDING_PAYMENT).paymentStatus(PaymentStatus.PENDING)
                .paymentMethod(OrderPaymentMethod.WALLET)
                .placedAt(placedAt).build());
        items.save(OrderItem.builder().order(order).referenceId(request.proposalId()).itemType(ItemType.PROPOSAL)
                .name(request.jobTitle()).quantity(1).unitPrice(request.price()).amount(request.price()).sortOrder(0).build());
        items.save(OrderItem.builder().order(order).itemType(ItemType.PLATFORM_FEE)
                .name("Phi nen tang").quantity(1).unitPrice(fee).amount(fee).sortOrder(1).build());

        // Reuse the existing DIGITAL lifecycle; no catalog package is purchased here.
        // Historical metadata; in-scope defect repair is unlimited.
        digitalHandler.create(order, new OrderCreationRequest(), PackageResponse.builder().revisionLimit(0).build());
        snapshots.save(OrderSnapshot.builder().order(order).proposalSnapshot(frozen)
                .rewardQuoteRef(rewardQuoteRef)
                .pricingSnapshot(orderFeeService.pricing(feePolicy).subtotal(request.price()).platformFee(fee)
                        .totalAmount(request.price()).providerNetAmount(net).currency(request.currency())
                        .paymentMethod(OrderPaymentMethod.WALLET).build())
                .providerSnapshot(ProviderSnapshot.builder().providerId(request.providerId()).build())
                .addOnSnapshot(List.of())
                .executionSnapshot(ExecutionSnapshot.builder().executionType(ExecutionType.DIGITAL).autoCompleteHours(72).build())
                .build());
        if (agreementVersions != null && agreementVersions.findTopByOrderIdOrderByVersionNoDesc(order.getOrderId()).isEmpty()) {
            String scope = request.jobTitle() + (request.jobDescription() == null || request.jobDescription().isBlank()
                    ? "" : "\n" + request.jobDescription());
            agreementVersions.save(OrderAgreementVersion.builder()
                    .orderId(order.getOrderId())
                    .versionNo(1)
                    .source("PROPOSAL")
                    .scope(scope)
                    .acceptanceCriteria(request.terms())
                    .paymentMethod(OrderPaymentMethod.WALLET)
                    .feePolicyVersionId(feePolicy.getFeePolicyVersionId())
                    .policyVersion("WG-POLICY-1.0")
                    .rewardQuoteRef(rewardQuoteRef)
                    .price(request.price())
                    .currency(request.currency())
                    .durationDays(request.estimatedDays())
                    .providerConfirmedAt(placedAt)
                    .clientConfirmedAt(placedAt)
                    .createdAt(placedAt)
                    .build());
        }
        statusService.recordCreated(order, request.clientId());
        return result(order, frozen, true);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public ProposalOrderService.CreationResult replay(CreateProposalOrderRequest request) {
        Order order = orders.findBySourceTypeAndSourceId(SourceType.PROPOSAL, request.proposalId()).orElse(null);
        if (order == null) return null;
        ProposalSnapshot frozen = snapshots.findById(order.getOrderId()).map(OrderSnapshot::getProposalSnapshot).orElse(null);
        if(request.rewardQuoteRef()!=null&&(!java.util.Objects.equals(request.acceptedAt(),order.getPlacedAt())||!request.rewardQuoteRef().equals(snapshots.findById(order.getOrderId()).map(OrderSnapshot::getRewardQuoteRef).orElse(null))))throw new AppException(ErrorCode.PROPOSAL_ORDER_CONFLICT);
        if (!ProposalSnapshot.from(request).equals(frozen)) throw new AppException(ErrorCode.PROPOSAL_ORDER_CONFLICT);
        return result(order, frozen, false);
    }

    private ProposalOrderService.CreationResult result(Order order, ProposalSnapshot snapshot, boolean created) {
        return new ProposalOrderService.CreationResult(new ProposalOrderResponse(order.getOrderId(), snapshot.proposalId(),
                snapshot.jobId(), order.getSourceType().name(), order.getOrderStatus().name()), created);
    }
}
