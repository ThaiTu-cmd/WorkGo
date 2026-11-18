package com.workgo.payment.service;

import com.workgo.payment.dto.request.PaymentCreationRequest;
import com.workgo.payment.dto.response.PaymentResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.PaymentMapper;
import com.workgo.payment.reppository.PaymentRepository;
import com.workgo.payment.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentService {

    public static final List<PaymentStatus> WAITING_STATUSES =
            List.of(PaymentStatus.INITIATED, PaymentStatus.PENDING);

    PaymentRepository paymentRepository;
    PaymentMapper paymentMapper;
    PaymentStatusService paymentStatusService;
    TokenUtils tokenUtils;

    //Order tra tu vi WorkGo (POST /wallet/orders/{orderId}/pay), cong chi con dung de nap vi
    public PaymentResponse createPayment(PaymentCreationRequest request, String idempotencyKey, String clientIp) {
        throw new AppException(ErrorCode.PAYMENT_ORDER_USE_WALLET);
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

    private Payment loadPayment(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
    }

}
