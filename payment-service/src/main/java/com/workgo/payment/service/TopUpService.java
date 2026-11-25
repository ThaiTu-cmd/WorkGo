package com.workgo.payment.service;

import com.workgo.payment.dto.gateway.GatewayCallbackResult;
import com.workgo.payment.dto.gateway.GatewayCharge;
import com.workgo.payment.dto.gateway.GatewayCreateResult;
import com.workgo.payment.dto.request.TopUpCreationRequest;
import com.workgo.payment.dto.request.TopUpResolveRequest;
import com.workgo.payment.dto.response.FinancialEligibilityResponse;
import com.workgo.payment.dto.response.TopUpResponse;
import com.workgo.payment.dto.response.WalletResponse;
import com.workgo.payment.entity.WalletTopUp;
import com.workgo.payment.enumeration.AdminActionType;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import com.workgo.payment.enumeration.TopUpStatus;
import com.workgo.payment.enumeration.WalletPostingType;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.TopUpMapper;
import com.workgo.payment.reppository.WalletTopUpRepository;
import com.workgo.payment.service.admin.AdminAction;
import com.workgo.payment.service.admin.AdminAuditService;
import com.workgo.payment.service.gateway.PaymentGatewayClient;
import com.workgo.payment.service.wallet.WalletAccountRef;
import com.workgo.payment.service.wallet.WalletPostingCommand;
import com.workgo.payment.service.wallet.WalletPostingLeg;
import com.workgo.payment.service.wallet.WalletPostingResult;
import com.workgo.payment.service.wallet.WalletService;
import com.workgo.payment.utils.PaymentCodeGenerator;
import com.workgo.payment.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class TopUpService {

    static ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    WalletTopUpRepository walletTopUpRepository;
    TopUpMapper topUpMapper;
    WalletService walletService;
    FeeReceivableService feeReceivableService;
    AdminAuditService adminAuditService;
    Map<PaymentGateway, PaymentGatewayClient> gatewayClients;
    PaymentCodeGenerator paymentCodeGenerator;
    TokenUtils tokenUtils;
    org.springframework.transaction.support.TransactionTemplate transactions;

    @NonFinal
    @Value("${payment.expire-minutes}")
    long expireMinutes;

    @NonFinal
    @Value("${payment.top-up.min-amount:10000}")
    long topUpMinAmount;

    @NonFinal
    @Value("${payment.top-up.daily-limit:5000000}")
    long topUpDailyLimit;

    public TopUpResponse createTopUp(TopUpCreationRequest request, String idempotencyKey, String clientIp) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new AppException(ErrorCode.PAYMENT_IDEMPOTENCY_KEY_REQUIRED);
        }

        long amount = toWholeVnd(request.getAmount());

        if (request.getGateway() == null) {
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_REQUIRED);
        }

        PaymentMethod paymentMethod = request.getPaymentMethod() == null ? PaymentMethod.QR : request.getPaymentMethod();

        if (!paymentMethod.viaGateway()) {
            throw new AppException(ErrorCode.PAYMENT_METHOD_NOT_SUPPORTED);
        }

        UUID userId = tokenUtils.getCurrentUserId();

        Optional<WalletTopUp> existed = walletTopUpRepository.findByIdempotencyKey(idempotencyKey);
        if (existed.isPresent()) {
            return toExistedResponse(existed.get(), userId, amount, request.getGateway(), paymentMethod);
        }

        PaymentGatewayClient gatewayClient = gatewayClients.get(request.getGateway());
        if (gatewayClient == null) {
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_NOT_SUPPORTED);
        }
        boolean[] reserved = {false};
        WalletTopUp topUp = transactions.execute(tx -> {
            walletService.lockedBalanceOf(WalletAccountRef.userAvailable(userId));
            var replay = walletTopUpRepository.findByIdempotencyKey(idempotencyKey);
            if (replay.isPresent()) {
                toExistedResponse(replay.get(), userId, amount, request.getGateway(), paymentMethod);
                return replay.get();
            }
            assertTopUpLimits(userId, amount);
            Instant now = Instant.now();
            reserved[0] = true;
            return walletTopUpRepository.saveAndFlush(WalletTopUp.builder()
                    .topUpCode(paymentCodeGenerator.generateTopUp()).userId(userId).amount(amount)
                    .gateway(request.getGateway()).currency(request.getGateway() == PaymentGateway.MOCK ? "TEST_VND" : "VND")
                    .paymentMethod(paymentMethod).idempotencyKey(idempotencyKey)
                    .createdAt(now).expiresAt(now.plus(Duration.ofMinutes(expireMinutes)))
                    .status(TopUpStatus.UNKNOWN).build());
        });
        // UNKNOWN is committed before external I/O. Replay only returns the reserved identity.
        if (!reserved[0]) {
            return topUpMapper.toResponse(topUp);
        }
        // Keep external I/O mutations off the entity retained by OpenEntityManagerInView.
        topUp = WalletTopUp.builder().topUpId(topUp.getTopUpId()).topUpCode(topUp.getTopUpCode())
                .userId(topUp.getUserId()).amount(topUp.getAmount()).currency(topUp.getCurrency())
                .gateway(topUp.getGateway()).createdAt(topUp.getCreatedAt()).expiresAt(topUp.getExpiresAt())
                .status(TopUpStatus.UNKNOWN).build();
        // A failed local response cannot prove that the provider did not accept the request.
        try {
            GatewayCreateResult result = gatewayClient.createPayment(GatewayCharge.builder()
                    .code(topUp.getTopUpCode())
                    .amount(BigDecimal.valueOf(amount))
                    .currency(topUp.getCurrency())
                    .paymentMethod(paymentMethod)
                    .description("Nap vi " + topUp.getTopUpCode())
                    .createdAt(topUp.getCreatedAt())
                    .expiresAt(topUp.getExpiresAt())
                    .build(), clientIp);

            topUp.setPaymentUrl(result.getPaymentUrl());
            topUp.setQrCodeUrl(result.getQrCodeUrl());
            topUp.setDeeplink(result.getDeeplink());
            topUp.setStatus(TopUpStatus.PENDING);
            log.info("Top-up {} created for user {}, gateway {}, amount {}",
                    topUp.getTopUpCode(), userId, topUp.getGateway(), amount);

        } catch (Exception e) {

            topUp.setFailureCode("GATEWAY_CREATE_UNKNOWN");
            topUp.setFailureMessage(e.getMessage());
            topUp.setStatus(TopUpStatus.UNKNOWN);
            saveCreateResult(topUp);
            log.warn("Create top-up {} failed at gateway {}: {}", topUp.getTopUpCode(), topUp.getGateway(), e.getMessage());

            if (e instanceof AppException appException) {
                throw appException;
            }

            throw new AppException(ErrorCode.GATEWAY_UNAVAILABLE);
        }

        return saveCreateResult(topUp);
    }

    private TopUpResponse saveCreateResult(WalletTopUp result) {
        return transactions.execute(tx -> {
            WalletTopUp current = walletTopUpRepository.findByIdForUpdate(result.getTopUpId()).orElseThrow();
            if (current.getStatus() == TopUpStatus.UNKNOWN) {
                current.setPaymentUrl(result.getPaymentUrl());
                current.setQrCodeUrl(result.getQrCodeUrl());
                current.setDeeplink(result.getDeeplink());
                current.setStatus(result.getStatus());
                current.setFailureCode(result.getFailureCode());
                current.setFailureMessage(result.getFailureMessage());
                current.setUpdatedAt(Instant.now());
                walletTopUpRepository.save(current);
            }
            return topUpMapper.toResponse(current);
        });
    }

    //callback da kiem chu ky o adapter; khoa dong top-up de 2 callback cung luc chi 1 ben ghi co
    @Transactional
    public TopUpResponse handleCallback(PaymentGateway gateway, GatewayCallbackResult result) {

        WalletTopUp topUp = walletTopUpRepository.findByTopUpCodeForUpdate(result.getPaymentCode())
                .orElseThrow(() -> new AppException(ErrorCode.TOP_UP_NOT_FOUND));

        if (gateway == PaymentGateway.MOCK && topUp.getGateway() == PaymentGateway.MOCK
                && "TEST_VND".equals(topUp.getCurrency())) {
            if (result.getAmount() == null || result.getAmount().compareTo(BigDecimal.valueOf(topUp.getAmount())) != 0)
                throw new AppException(ErrorCode.TOP_UP_SOURCE_MISMATCH);
            if (topUp.getStatus() != TopUpStatus.SUCCEEDED
                    && !(topUp.getStatus() == TopUpStatus.FAILED && !result.isSuccess())) {
                transition(topUp, result.isSuccess() ? TopUpStatus.SUCCEEDED : TopUpStatus.FAILED);
                topUp.setFailureMessage("SIMULATION_ONLY: no spendable wallet credit or partner confirmation");
                walletTopUpRepository.save(topUp);
            }
            return topUpMapper.toResponse(topUp);
        }
        assertSameSource(topUp, gateway, result);

        if (topUp.getStatus() == TopUpStatus.SUCCEEDED) {
            if (!Objects.equals(topUp.getGatewayTxnId(), result.getGatewayTxnId())) {
                log.warn("Top-up {} already credited by txn {}, ignore txn {}",
                        topUp.getTopUpCode(), topUp.getGatewayTxnId(), result.getGatewayTxnId());
            }
            return topUpMapper.toResponse(topUp);
        }

        topUp.setRawResponse(result.getRawResponse());

        if (!result.isSuccess()) {
            if (topUp.getStatus().canTransitionTo(TopUpStatus.FAILED)) {
                topUp.setFailureCode(result.getFailureCode());
                topUp.setFailureMessage(result.getFailureMessage());
                transition(topUp, TopUpStatus.FAILED);
                log.info("Top-up {} failed: {}", topUp.getTopUpCode(), result.getFailureCode());
            }
            return topUpMapper.toResponse(walletTopUpRepository.save(topUp));
        }

        if (topUp.getStatus() != TopUpStatus.PENDING) {
            log.warn("Top-up {} confirmed late from status {}", topUp.getTopUpCode(), topUp.getStatus());
        }

        credit(topUp, result.getGatewayTxnId());

        return topUpMapper.toResponse(walletTopUpRepository.save(topUp));
    }

    //doi soat lenh UNKNOWN theo bang chung cong (ma giao dich / sao ke); khong dua vao "DB chua co receipt"
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public TopUpResponse resolveUnknown(UUID topUpId, TopUpResolveRequest request) {

        WalletTopUp topUp = walletTopUpRepository.findByIdForUpdate(topUpId)
                .orElseThrow(() -> new AppException(ErrorCode.TOP_UP_NOT_FOUND));

        if (topUp.getStatus() != TopUpStatus.UNKNOWN || request == null
                || (request.getResult() != TopUpStatus.SUCCEEDED && request.getResult() != TopUpStatus.FAILED)
                || isBlank(request.getExternalReference()) || isBlank(request.getReason())) {
            throw new AppException(ErrorCode.TOP_UP_RESOLVE_INVALID);
        }

        PaymentGatewayClient adapter = gatewayClients.get(topUp.getGateway());
        if (adapter == null) throw new AppException(ErrorCode.TOP_UP_RESOLVE_INVALID);
        GatewayCallbackResult verified = request.getSourceEvidence() == null
                ? adapter.verifyExternalResult(request.getExternalReference())
                : adapter.verifyCallback(request.getSourceEvidence());
        assertSameSource(topUp, topUp.getGateway(), verified);
        if (!Objects.equals(topUp.getTopUpCode(), verified.getPaymentCode())
                || !Objects.equals(request.getExternalReference(), verified.getGatewayTxnId())
                || verified.isSuccess() != (request.getResult() == TopUpStatus.SUCCEEDED)) {
            throw new AppException(ErrorCode.TOP_UP_RESOLVE_INVALID);
        }

        TopUpResponse before = topUpMapper.toResponse(topUp);
        topUp.setRawResponse(verified.getRawResponse());

        if (request.getResult() == TopUpStatus.SUCCEEDED) {
            credit(topUp, verified.getGatewayTxnId());
        } else {
            topUp.setFailureCode("RECONCILED_FAILED");
            topUp.setFailureMessage(request.getExternalReference());
            transition(topUp, TopUpStatus.FAILED);
        }

        TopUpResponse after = topUpMapper.toResponse(walletTopUpRepository.save(topUp));

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.TOP_UP_RESOLVED)
                .targetType("TOP_UP")
                .targetId(topUpId)
                .reason(request.getReason())
                .beforeState(before)
                .afterState(after)
                .build());

        return after;
    }

    //het han ma chua co ket qua: co the da tra nhung mat callback -> cho tra cuu, khong tu coi la that bai
    @Transactional
    public void markUnknownIfExpired(UUID topUpId) {

        WalletTopUp topUp = walletTopUpRepository.findByIdForUpdate(topUpId)
                .orElseThrow(() -> new AppException(ErrorCode.TOP_UP_NOT_FOUND));

        if (topUp.getStatus() != TopUpStatus.PENDING || topUp.getExpiresAt().isAfter(Instant.now())) {
            return;
        }

        transition(topUp, TopUpStatus.UNKNOWN);
        walletTopUpRepository.save(topUp);
        log.info("Top-up {} expired without gateway result, wait for reconciliation", topUp.getTopUpCode());
    }

    @Transactional(readOnly = true)
    public TopUpResponse getMyTopUp(UUID topUpId) {

        return walletTopUpRepository.findByTopUpIdAndUserId(topUpId, tokenUtils.getCurrentUserId())
                .map(topUpMapper::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.TOP_UP_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<TopUpResponse> getMyTopUps() {

        return walletTopUpRepository.findAllByUserIdOrderByCreatedAtDesc(tokenUtils.getCurrentUserId())
                .stream()
                .map(topUpMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WalletResponse getMyWallet() {

        FinancialEligibilityResponse eligibility = feeReceivableService.eligibilityOf(tokenUtils.getCurrentUserId());

        return WalletResponse.builder()
                .userId(eligibility.getUserId())
                .balance(eligibility.getBalance())
                .outstandingFee(eligibility.getOutstandingFee())
                .mayStartNewWork(eligibility.isMayStartNewWork())
                .currency("VND")
                .build();
    }

    public boolean isTopUpCode(String code) {
        return code != null && code.startsWith(PaymentCodeGenerator.TOP_UP_PREFIX);
    }

    //=====================================

    //cung transaction voi doi status: rollback thi khong ben nao duoc ghi
    private void credit(WalletTopUp topUp, String gatewayTxnId) {

        WalletPostingResult posting = walletService.post(WalletPostingCommand.builder()
                .idempotencyKey("TOP_UP:" + topUp.getTopUpId())
                .postingType(WalletPostingType.TOP_UP)
                .obligationId(topUp.getTopUpId())
                .description("Top-up " + topUp.getTopUpCode())
                .legs(List.of(
                        new WalletPostingLeg(WalletAccountRef.externalClearing(), -topUp.getAmount()),
                        new WalletPostingLeg(WalletAccountRef.userAvailable(topUp.getUserId()), topUp.getAmount())))
                .build());

        topUp.setGatewayTxnId(gatewayTxnId);
        topUp.setWalletTransactionId(posting.walletTransactionId());
        topUp.setConfirmedAt(Instant.now());
        topUp.setFailureCode(null);
        topUp.setFailureMessage(null);
        transition(topUp, TopUpStatus.SUCCEEDED);
        log.info("Top-up {} credited {} to user {}", topUp.getTopUpCode(), topUp.getAmount(), topUp.getUserId());

        feeReceivableService.settleAfterCredit(topUp.getUserId());
    }

    // Keep failed reservations in the daily cap: a later signed success can still credit them.
    private void assertTopUpLimits(UUID userId, long amount) {

        Instant startOfDay = LocalDate.now(VIETNAM).atStartOfDay(VIETNAM).toInstant();
        long usedToday = walletTopUpRepository.sumAmountSince(userId, startOfDay, TopUpStatus.INITIATED);

        if (amount < topUpMinAmount || amount > topUpDailyLimit || usedToday > topUpDailyLimit - amount) {
            throw new AppException(ErrorCode.TOP_UP_LIMIT_EXCEEDED);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private long toWholeVnd(BigDecimal amount) {

        if (amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 0) {
            throw new AppException(ErrorCode.TOP_UP_AMOUNT_INVALID);
        }

        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            throw new AppException(ErrorCode.TOP_UP_AMOUNT_INVALID);
        }
    }

    private void assertSameSource(WalletTopUp topUp, PaymentGateway gateway, GatewayCallbackResult result) {

        if (gateway == PaymentGateway.MOCK || result == null || !result.isVerified()
                || !Objects.equals(topUp.getCurrency(), result.getCurrency())
                || !Objects.equals(topUp.getTopUpCode(), result.getPaymentCode())
                || (result.isSuccess() && isBlank(result.getGatewayTxnId()))
                || topUp.getGateway() != gateway
                || result.getAmount() == null
                || result.getAmount().compareTo(BigDecimal.valueOf(topUp.getAmount())) != 0) {
            throw new AppException(ErrorCode.TOP_UP_SOURCE_MISMATCH);
        }
    }

    private void transition(WalletTopUp topUp, TopUpStatus toStatus) {

        if (!topUp.getStatus().canTransitionTo(toStatus)) {
            throw new AppException(ErrorCode.PAYMENT_INVALID_STATUS_TRANSITION);
        }

        topUp.setStatus(toStatus);
        topUp.setUpdatedAt(Instant.now());
    }

    private TopUpResponse toExistedResponse(WalletTopUp topUp, UUID userId, long amount, PaymentGateway gateway, PaymentMethod method) {

        if (!topUp.getUserId().equals(userId) || topUp.getAmount() != amount || topUp.getGateway() != gateway || topUp.getPaymentMethod() != method) {
            throw new AppException(ErrorCode.TOP_UP_IDEMPOTENCY_KEY_REUSED);
        }

        return topUpMapper.toResponse(topUp);
    }

}
