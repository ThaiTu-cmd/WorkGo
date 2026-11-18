package com.workgo.payment.service;

import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.dto.response.client.OrderPaymentInfoResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.client.ExecutionType;
import com.workgo.payment.enumeration.client.OrderPaymentMethod;
import com.workgo.payment.enumeration.client.OrderStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.EscrowMapper;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.client.OrderClient;
import com.workgo.payment.service.wallet.WalletOrderSettlementService;
import com.workgo.payment.utils.TokenUtils;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class WalletOrderPaymentService {

    EscrowAccountRepository escrowAccountRepository;
    WalletOrderSettlementService walletOrderSettlementService;
    WalletOrderSyncService walletOrderSyncService;
    EscrowMapper escrowMapper;
    OrderClient orderClient;
    ProviderAccountService providerAccountService;
    TokenUtils tokenUtils;

    public EscrowAccountResponse payOrder(UUID orderId) {

        UUID clientId = tokenUtils.getCurrentUserId();

        Optional<EscrowAccount> existed = escrowAccountRepository.findByOrderId(orderId);
        if (existed.isPresent()) {
            return toExistedResponse(existed.get(), clientId);
        }

        OrderPaymentInfoResponse order = loadOrderInfo(orderId);

        if (!clientId.equals(order.getClientId())) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        if (order.getPaymentMethod() == OrderPaymentMethod.CASH) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_PAID_IN_CASH);
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_NOT_PAYABLE);
        }

        if (order.getPayableUntil() != null && !order.getPayableUntil().isAfter(Instant.now())) {
            throw new AppException(order.getExecutionType() == ExecutionType.ONSITE
                    ? ErrorCode.PAYMENT_SLOT_HOLD_EXPIRED
                    : ErrorCode.PAYMENT_ORDER_NOT_PAYABLE);
        }

        long total = toWholeVnd(order.getTotalAmount());
        long fee = order.getPlatformFee() == null ? 0
                : order.getPlatformFee().setScale(0, RoundingMode.HALF_UP).longValueExact();

        UUID providerUserId = providerAccountService.userIdOf(order.getProviderId());

        EscrowAccount escrow;
        try {
            escrow = walletOrderSettlementService.hold(orderId, clientId, order.getProviderId(), providerUserId,
                    order.getFeePolicyVersionId(), total, fee);
        } catch (DataIntegrityViolationException e) {
            //2 request cung luc: ben thua chi rollback, but toan cung key khong tru them
            return toExistedResponse(escrowAccountRepository.findByOrderId(orderId).orElseThrow(() -> e), clientId);
        }

        try {
            walletOrderSyncService.syncOrder(escrow.getEscrowAccountId());
        } catch (Exception e) {
            log.warn("Sync order {} after wallet hold failed, job will retry", orderId, e);
        }

        return escrowMapper.toResponse(escrowAccountRepository.findById(escrow.getEscrowAccountId()).orElse(escrow));
    }

    //=====================================

    private EscrowAccountResponse toExistedResponse(EscrowAccount escrow, UUID clientId) {

        if (!escrow.getClientId().equals(clientId)) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        if (escrow.getFundingSource() != EscrowFundingSource.WALLET) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ALREADY_PAID);
        }

        return escrowMapper.toResponse(escrow);
    }

    private long toWholeVnd(BigDecimal amount) {

        if (amount == null || amount.signum() <= 0) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_NOT_WHOLE_VND);
        }

        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_NOT_WHOLE_VND);
        }
    }

    private OrderPaymentInfoResponse loadOrderInfo(UUID orderId) {

        try {
            return orderClient.getPaymentInfo(orderId);
        } catch (FeignException e) {
            if (e.status() == HttpStatus.NOT_FOUND.value()) {
                throw new AppException(ErrorCode.ORDER_NOT_FOUND);
            }
            throw new AppException(ErrorCode.ORDER_SERVICE_UNAVAILABLE);
        }
    }

}
