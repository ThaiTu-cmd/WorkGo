package com.workgo.payment.service;

import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.request.PaymentCreationRequest;
import com.workgo.payment.dto.response.PaymentResponse;
import com.workgo.payment.dto.response.client.OrderPaymentInfoResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.enumeration.client.ExecutionType;
import com.workgo.payment.enumeration.client.OrderStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.PaymentMapper;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.reppository.PaymentRepository;
import com.workgo.payment.reppository.client.OrderClient;
import com.workgo.payment.service.gateway.PaymentGatewayClient;
import com.workgo.payment.utils.PaymentCodeGenerator;
import com.workgo.payment.utils.TokenUtils;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentService {

    public static final List<PaymentStatus> WAITING_STATUSES =
            List.of(PaymentStatus.INITIATED, PaymentStatus.PENDING);

    PaymentRepository paymentRepository;
    EscrowAccountRepository escrowAccountRepository;
    PaymentMapper paymentMapper;
    OrderClient orderClient;
    Map<PaymentGateway, PaymentGatewayClient> gatewayClients;
    PaymentCodeGenerator paymentCodeGenerator;
    PaymentStatusService paymentStatusService;
    TokenUtils tokenUtils;

    @NonFinal
    @Value("${payment.expire-minutes}")
    long expireMinutes;

    @NonFinal
    @Value("${payment.slot-min-remaining-minutes}")
    long slotMinRemainingMinutes;


    public PaymentResponse createPayment(PaymentCreationRequest request, String idempotencyKey, String clientIp) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new AppException(ErrorCode.PAYMENT_IDEMPOTENCY_KEY_REQUIRED);
        }

        if (request.getOrderId() == null) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ID_REQUIRED);
        }

        if (request.getGateway() == null) {
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_REQUIRED);
        }

        UUID payerId = tokenUtils.getCurrentUserId();

        Optional<Payment> existed = paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existed.isPresent()) {
            return toExistedResponse(existed.get(), request.getOrderId(), payerId);
        }

        PaymentGatewayClient gatewayClient = gatewayClients.get(request.getGateway());

        if (gatewayClient == null) {
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_NOT_SUPPORTED);
        }

        //lay so tien can thanh toan tu order
        OrderPaymentInfoResponse order = loadOrderInfo(request.getOrderId());

        //chi chu don moi duoc thanh toan
        if (!payerId.equals(order.getClientId())) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_NOT_PAYABLE);
        }

        if (escrowAccountRepository.existsByOrderId(order.getOrderId())) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_ALREADY_PAID);
        }

        Instant now = Instant.now();
        Instant expiresAt = resolveExpiresAt(order, now);

        //order dang co payment cho thanh toan
        Optional<Payment> waiting = paymentRepository
                .findFirstByOrderIdAndStatusInOrderByCreatedAtDesc(order.getOrderId(), WAITING_STATUSES);

        if (waiting.isPresent()) {

            Payment old = waiting.get();

            if (old.getStatus() == PaymentStatus.PENDING
                    && old.getGateway() == request.getGateway()
                    && old.getExpiresAt().isAfter(now)) {
                return paymentMapper.toResponse(old);
            }

            //doi gateway hoac da qua han -> dong payment cu
            closeWaitingPayment(old, now);
        }

        Payment payment = Payment.builder()
                .paymentCode(paymentCodeGenerator.generate())
                .orderId(order.getOrderId())
                .payerId(payerId)
                .providerId(order.getProviderId())
                .amount(order.getTotalAmount())
                .platformFeeAmount(order.getPlatformFee())
                .providerNetAmount(order.getProviderNetAmount())
                .currency(order.getCurrency() == null ? "VND" : order.getCurrency())
                .gateway(request.getGateway())
                .paymentMethod(request.getPaymentMethod() == null
                        ? PaymentMethod.QR : request.getPaymentMethod())
                .idempotencyKey(idempotencyKey)
                .expiresAt(expiresAt)
                .build();

        try {
            payment = paymentRepository.saveAndFlush(payment);
        } catch (DataIntegrityViolationException e) {

            Payment other = paymentRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseThrow(() -> e);

            return toExistedResponse(other, request.getOrderId(), payerId);
        }

        try {
            GatewayCreateResult result = gatewayClient.createPayment(payment, clientIp);

            payment.setPaymentUrl(result.getPaymentUrl());
            payment.setQrCodeUrl(result.getQrCodeUrl());
            payment.setDeeplink(result.getDeeplink());
            paymentStatusService.transition(payment, PaymentStatus.PENDING);
            log.info("Payment {} created for order {}, gateway {}, amount {}",
                    payment.getPaymentCode(), payment.getOrderId(), payment.getGateway(), payment.getAmount());

        } catch (Exception e) {

            payment.setFailureCode("GATEWAY_CREATE_FAILED");
            payment.setFailureMessage(e.getMessage());
            paymentStatusService.transition(payment, PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.warn("Create payment {} for order {} failed at gateway {}: {}",
                    payment.getPaymentCode(), payment.getOrderId(), payment.getGateway(), e.getMessage());

            //loi nghiep vu cua gateway (vd so tien ngoai gioi han) -> tra dung ma loi
            if (e instanceof AppException appException) {
                throw appException;
            }

            throw new AppException(ErrorCode.GATEWAY_UNAVAILABLE);
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId) {

        Payment payment = loadPayment(paymentId);

        if (!tokenUtils.getCurrentUserId().equals(payment.getPayerId())) {
            throw new AppException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        return paymentMapper.toResponse(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsOfOrder(UUID orderId) {

        return paymentRepository
                .findAllByOrderIdAndPayerIdOrderByCreatedAtDesc(orderId, tokenUtils.getCurrentUserId())
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Transactional
    public void expirePayment(UUID paymentId) {

        Payment payment = loadPayment(paymentId);

        //IPN vua ve truoc job -> bo qua
        if (!WAITING_STATUSES.contains(payment.getStatus())
                || payment.getExpiresAt().isAfter(Instant.now())) {
            return;
        }

        paymentStatusService.transition(payment, PaymentStatus.EXPIRED);
        paymentRepository.save(payment);
    }

    //=====================================

    //payment het han truoc khi slot het han (onsite) / truoc khi order tu huy (PaymentTimeoutJob)
    private Instant resolveExpiresAt(OrderPaymentInfoResponse order, Instant now) {

        Instant expiresAt = now.plus(Duration.ofMinutes(expireMinutes));
        boolean onsite = order.getExecutionType() == ExecutionType.ONSITE;
        Instant payableUntil = order.getPayableUntil();

        //digital chua co han -> +15'
        if (!onsite && payableUntil == null) {
            return expiresAt;
        }

        if (payableUntil == null
                || payableUntil.isBefore(now.plus(Duration.ofMinutes(slotMinRemainingMinutes)))) {
            throw new AppException(onsite
                    ? ErrorCode.PAYMENT_SLOT_HOLD_EXPIRED
                    : ErrorCode.PAYMENT_ORDER_NOT_PAYABLE);
        }

        return payableUntil.isBefore(expiresAt) ? payableUntil : expiresAt;
    }

    private void closeWaitingPayment(Payment payment, Instant now) {

        PaymentStatus toStatus = payment.getExpiresAt().isAfter(now)
                ? PaymentStatus.CANCELLED
                : PaymentStatus.EXPIRED;

        paymentStatusService.transition(payment, toStatus);
        paymentRepository.save(payment);
    }

    private PaymentResponse toExistedResponse(Payment payment, UUID orderId, UUID payerId) {

        if (!payment.getPayerId().equals(payerId) || !payment.getOrderId().equals(orderId)) {
            throw new AppException(ErrorCode.PAYMENT_IDEMPOTENCY_KEY_REUSED);
        }

        return paymentMapper.toResponse(payment);
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

    private Payment loadPayment(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
    }

}
