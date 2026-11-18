package com.workgo.order.service;

import com.workgo.order.dto.request.ApplyDecisionCommand;
import com.workgo.order.dto.response.AppliedDecisionResult;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderDisputeDecision;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.DigitalExecutionRepository;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import com.workgo.order.reppository.OrderDisputeDecisionRepository;
import com.workgo.order.reppository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class DisputeDecisionApplicationService {

    OrderDisputeDecisionRepository orderDisputeDecisionRepository;
    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    OrderStatusService orderStatusService;

    //trust goi sau khi payment da chot tien (viec 27); cash thi khong co ket qua escrow
    @Transactional
    public AppliedDecisionResult apply(UUID orderId, ApplyDecisionCommand command) {

        assertValid(command);
        String payloadHash = payloadHash(orderId, command);

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        //goi lai sau timeout: tra ket qua cu, khong doi trang thai / tao event lan 2
        Optional<OrderDisputeDecision> applied = orderDisputeDecisionRepository.findByDecisionId(command.getDecisionId());
        if (applied.isPresent()) {
            if (!applied.get().getOrderId().equals(orderId) || !applied.get().getPayloadHash().equals(payloadHash)) {
                throw new AppException(ErrorCode.ORDER_DECISION_CONFLICT);
            }
            return toResult(applied.get(), true);
        }

        //order da ket thuc theo cach khac -> bao xung dot, khong ACK gia
        if (orderDisputeDecisionRepository.existsByOrderId(orderId)
                || order.getOrderStatus() == OrderStatus.COMPLETED
                || order.getOrderStatus() == OrderStatus.CANCELLED
                || order.getOrderStatus() == OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.ORDER_DECISION_TERMINAL_CONFLICT);
        }

        boolean release = command.getOperation() == DecisionOperation.RELEASE;
        OrderStatus target = release ? OrderStatus.COMPLETED : OrderStatus.CANCELLED;

        assertSettlementMatches(order, command, release);

        //tien da chot o payment: danh dau de PaymentSync khong goi release / refund nua
        if (order.getPaymentStatus() == PaymentStatus.SUCCEEDED) {
            order.setPaymentStatus(release ? PaymentStatus.RELEASED : PaymentStatus.REFUNDED);
        }

        closeExecution(order, release);
        orderStatusService.applyDecision(order, target, command.getDecidedBy());

        OrderDisputeDecision decision = orderDisputeDecisionRepository.saveAndFlush(OrderDisputeDecision.builder()
                .decisionId(command.getDecisionId())
                .orderId(orderId)
                .disputeId(command.getDisputeId())
                .payloadHash(payloadHash)
                .operation(command.getOperation())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .decidedBy(command.getDecidedBy())
                .effectiveAt(command.getEffectiveAt())
                .settlementReceiptId(command.getSettlementReceiptId())
                .settleTransactionId(command.getSettleTransactionId())
                .build());

        log.info("Decision {} applied to order {}: {}", command.getDecisionId(), orderId, target);

        return toResult(decision, false);
    }

    //=====================================

    private void assertValid(ApplyDecisionCommand command) {

        if (command.getDecisionId() == null || command.getDisputeId() == null || command.getOperation() == null
                || command.getDecidedBy() == null || command.getEffectiveAt() == null) {
            throw new AppException(ErrorCode.ORDER_DECISION_INVALID);
        }
    }

    //don vi phai co ket qua escrow khop dung don; cash khong duoc gia escrow
    private void assertSettlementMatches(Order order, ApplyDecisionCommand command, boolean release) {

        boolean hasSettlement = Stream.of(command.getSettlementReceiptId(), command.getSettleTransactionId(),
                command.getDestination(), command.getDestinationId(), command.getSettledAmount(),
                command.getDestinationAmount(), command.getFeeAmount(), command.getEscrowStatus()).anyMatch(Objects::nonNull);

        if (order.getPaymentStatus() == PaymentStatus.CASH_ON_SITE) {
            if (hasSettlement) throw new AppException(ErrorCode.ORDER_DECISION_SETTLEMENT_MISMATCH);
            return;
        }

        if (order.getPaymentStatus() != PaymentStatus.SUCCEEDED
                || command.getSettlementReceiptId() == null || command.getSettleTransactionId() == null
                || command.getSettledAmount() == null || command.getDestinationAmount() == null
                || command.getFeeAmount() == null) {
            throw new AppException(ErrorCode.ORDER_DECISION_SETTLEMENT_MISMATCH);
        }

        long total = command.getSettledAmount();
        boolean amountsMatch = order.getTotalAmount().compareTo(BigDecimal.valueOf(total)) == 0
                && command.getDestinationAmount() >= 0 && command.getFeeAmount() >= 0
                && (release
                ? command.getDestinationAmount() + command.getFeeAmount() == total
                : command.getDestinationAmount() <= total);

        if (!amountsMatch
                || !(release ? "RELEASED" : "REFUNDED").equals(command.getEscrowStatus())
                || !(release ? "PROVIDER" : "CLIENT").equals(command.getDestination())
                || !(release ? order.getProviderId() : order.getClientId()).equals(command.getDestinationId())) {
            throw new AppException(ErrorCode.ORDER_DECISION_SETTLEMENT_MISMATCH);
        }
    }

    private void closeExecution(Order order, boolean release) {

        executionRepository.findByOrder_OrderId(order.getOrderId()).ifPresent(execution -> {

            if (release) {
                execution.setCompletedAt(Instant.now());
                executionRepository.save(execution);
            }

            switch (order.getExecutionType()) {
                case DIGITAL -> digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .ifPresent(digital -> {
                            digital.setStatus(release ? DigitalExecutionStatus.ACCEPT : DigitalExecutionStatus.CANCELLED);
                            digitalExecutionRepository.save(digital);
                        });
                case ONSITE -> onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .ifPresent(onsite -> {
                            onsite.setStatus(release ? OnsiteExecutionStatus.ACCEPT : OnsiteExecutionStatus.CANCELLED);
                            onsiteExecutionRepository.save(onsite);
                        });
            }
        });
    }

    //hash tu payload da chuan hoa, khong tin hash ben goi tu khai
    private String payloadHash(UUID orderId, ApplyDecisionCommand command) {

        String payload = Stream.of(orderId, command.getDecisionId(), command.getDisputeId(), command.getOperation(),
                        command.getDecidedBy(), command.getEffectiveAt(), command.getSettlementReceiptId(),
                        command.getSettleTransactionId(), command.getDestination(), command.getDestinationId(),
                        command.getSettledAmount(), command.getDestinationAmount(), command.getFeeAmount(),
                        command.getEscrowStatus())
                .map(value -> Objects.toString(value, "-"))
                .reduce((first, second) -> first + "|" + second)
                .orElseThrow();

        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private AppliedDecisionResult toResult(OrderDisputeDecision decision, boolean replayed) {

        return AppliedDecisionResult.builder()
                .decisionId(decision.getDecisionId())
                .orderId(decision.getOrderId())
                .disputeId(decision.getDisputeId())
                .operation(decision.getOperation())
                .orderStatus(decision.getOrderStatus())
                .paymentStatus(decision.getPaymentStatus())
                .settlementReceiptId(decision.getSettlementReceiptId())
                .appliedAt(decision.getAppliedAt())
                .replayed(replayed)
                .build();
    }
}
