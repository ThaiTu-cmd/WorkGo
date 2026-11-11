package com.workgo.payment.service;

import com.workgo.payment.dto.request.EscrowReleaseRequest;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.EscrowTransaction;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.entity.Refund;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.EscrowTxnType;
import com.workgo.payment.enumeration.TriggeredBy;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.EscrowMapper;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.EscrowTransactionRepository;
import com.workgo.payment.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class EscrowService {

    EscrowAccountRepository escrowAccountRepository;
    EscrowTransactionRepository escrowTransactionRepository;
    EscrowMapper escrowMapper;
    TokenUtils tokenUtils;

    //giu tien sau khi thanh toan thanh cong
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<EscrowAccount> hold(Payment payment) {

        if (escrowAccountRepository.existsByOrderId(payment.getOrderId())) {
            return Optional.empty();
        }

        EscrowAccount escrow = escrowAccountRepository.save(EscrowAccount.builder()
                .heldAmount(payment.getAmount())
                .platformFeeAmount(payment.getPlatformFeeAmount())
                .providerNetAmount(payment.getProviderNetAmount())
                .currency(payment.getCurrency())
                .heldAt(Instant.now())
                .orderId(payment.getOrderId())
                .clientId(payment.getPayerId())
                .providerId(payment.getProviderId())
                .payment(payment)
                .build());

        escrowTransactionRepository.save(EscrowTransaction.builder()
                .txnType(EscrowTxnType.HOLD)
                .amount(payment.getAmount())
                .balanceAfter(payment.getAmount())
                .triggeredBy(TriggeredBy.GATEWAY)
                .escrowAccount(escrow)
                .build());

        log.info("Escrow hold {} for order {}, payment {}", payment.getAmount(), payment.getOrderId(), payment.getPaymentCode());

        return Optional.of(escrow);
    }

    //order COMPLETED -> tru phi nen tang, phan con lai tra provider
    @Transactional
    public EscrowAccountResponse release(EscrowReleaseRequest request) {

        if (request.getOrderId() == null) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ID_REQUIRED);
        }

        EscrowAccount escrow = escrowAccountRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));

        //order goi lai -> tra ket qua cu, khong ghi txn moi
        if (escrow.getStatus() == EscrowStatus.RELEASED) {
            return escrowMapper.toResponse(escrow);
        }

        if (!escrow.getStatus().canTransitionTo(EscrowStatus.RELEASED)) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        BigDecimal fee = escrow.getPlatformFeeAmount() == null
                ? BigDecimal.ZERO : escrow.getPlatformFeeAmount();
        BigDecimal balance = escrow.getHeldAmount().subtract(fee);

        if (fee.signum() > 0) {
            addTransaction(escrow, EscrowTxnType.FEE, fee, balance, TriggeredBy.ORDER, "ORDER_COMPLETED");
        }

        addTransaction(escrow, EscrowTxnType.RELEASE, balance, BigDecimal.ZERO, TriggeredBy.ORDER, "ORDER_COMPLETED");

        Instant now = Instant.now();

        escrow.setReleasedAmount(escrow.getHeldAmount());
        escrow.setReleasedAt(now);
        escrow.setStatus(EscrowStatus.RELEASED);
        escrow.setUpdatedAt(now);

        log.info("Escrow released for order {}, fee {}, provider net {}", escrow.getOrderId(), fee, balance);

        return escrowMapper.toResponse(escrowAccountRepository.save(escrow));
    }

    //tra lai toan bo tien dang giu cho client, RefundService goi sau khi gateway hoan tien xong
    @Transactional(propagation = Propagation.MANDATORY)
    public void refund(EscrowAccount escrow, Refund refund) {

        if (!escrow.getStatus().canTransitionTo(EscrowStatus.REFUNDED)) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATUS);
        }

        addTransaction(escrow, EscrowTxnType.REFUND, refund.getAmount(), BigDecimal.ZERO,
                refund.getInitiatedBy(), refund.getReasonCode().name());

        Instant now = Instant.now();

        escrow.setRefundedAmount(refund.getAmount());
        escrow.setRefundedAt(now);
        escrow.setStatus(EscrowStatus.REFUNDED);
        escrow.setUpdatedAt(now);

        escrowAccountRepository.save(escrow);

        log.info("Escrow refunded {} for order {}, reason {}", refund.getAmount(), escrow.getOrderId(), refund.getReasonCode());
    }

    //client hoac provider cua order xem tien dang giu
    @Transactional(readOnly = true)
    public EscrowAccountResponse getEscrowOfOrder(UUID orderId) {

        EscrowAccount escrow = escrowAccountRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));

        assertParticipant(escrow);

        return escrowMapper.toResponse(escrow);
    }

    //=====================================

    //them vao list de response tra ve du txn vua ghi
    private void addTransaction(EscrowAccount escrow, EscrowTxnType type, BigDecimal amount,
                                BigDecimal balanceAfter, TriggeredBy triggeredBy, String reasonCode) {

        escrow.getTransactions().add(escrowTransactionRepository.save(EscrowTransaction.builder()
                .txnType(type)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .triggeredBy(triggeredBy)
                .reasonCode(reasonCode)
                .escrowAccount(escrow)
                .build()));
    }

    //nguoi ngoai -> bao not found de khong lo escrow cua nguoi khac
    private void assertParticipant(EscrowAccount escrow) {

        if (tokenUtils.getCurrentUserId().equals(escrow.getClientId())) {
            return;
        }

        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();

        if (providerId != null && providerId.equals(escrow.getProviderId())) {
            return;
        }

        throw new AppException(ErrorCode.ESCROW_NOT_FOUND);
    }

}
