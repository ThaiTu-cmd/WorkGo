package com.workgo.payment.service;

import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.entity.EscrowTransaction;
import com.workgo.payment.entity.Payment;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class EscrowService {

    EscrowAccountRepository escrowAccountRepository;
    EscrowTransactionRepository escrowTransactionRepository;
    EscrowMapper escrowMapper;
    TokenUtils tokenUtils;

    //giu tien sau khi thanh toan thanh cong, empty = order da co escrow (thanh toan trung)
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

        return Optional.of(escrow);
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
