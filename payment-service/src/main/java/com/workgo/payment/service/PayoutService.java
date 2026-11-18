package com.workgo.payment.service;

import com.workgo.payment.dto.request.PayoutActionRequest;
import com.workgo.payment.dto.request.PayoutCreationRequest;
import com.workgo.payment.dto.response.PayoutResponse;
import com.workgo.payment.entity.WalletPayout;
import com.workgo.payment.enumeration.AdminActionType;
import com.workgo.payment.enumeration.PayoutStatus;
import com.workgo.payment.enumeration.WalletPostingType;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.PayoutMapper;
import com.workgo.payment.reppository.WalletPayoutRepository;
import com.workgo.payment.service.admin.AdminAction;
import com.workgo.payment.service.admin.AdminAuditService;
import com.workgo.payment.service.wallet.WalletAccountRef;
import com.workgo.payment.service.wallet.WalletPostingCommand;
import com.workgo.payment.service.wallet.WalletPostingLeg;
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
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PayoutService {

    static ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    WalletPayoutRepository walletPayoutRepository;
    PayoutMapper payoutMapper;
    WalletService walletService;
    FeeReceivableService feeReceivableService;
    AdminAuditService adminAuditService;
    PaymentCodeGenerator paymentCodeGenerator;
    TokenUtils tokenUtils;

    @NonFinal
    @Value("${payment.payout.min-amount:50000}")
    long minAmount;

    @NonFinal
    @Value("${payment.payout.daily-limit:5000000}")
    long dailyLimit;

    //chuyen tien kha dung sang tai khoan cho chi; chua phai da ve ngan hang
    @Transactional
    public PayoutResponse requestPayout(PayoutCreationRequest request, String idempotencyKey) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new AppException(ErrorCode.PAYMENT_IDEMPOTENCY_KEY_REQUIRED);
        }

        long amount = toWholeVnd(request.getAmount());

        if (amount < minAmount || isBlank(request.getBankCode()) || isBlank(request.getAccountNumber())
                || isBlank(request.getAccountName())) {
            throw new AppException(ErrorCode.PAYOUT_INVALID);
        }

        UUID userId = tokenUtils.getCurrentUserId();

        Optional<WalletPayout> existed = walletPayoutRepository.findByIdempotencyKey(idempotencyKey);
        if (existed.isPresent()) {
            if (!existed.get().getUserId().equals(userId) || existed.get().getAmount() != amount) {
                throw new AppException(ErrorCode.PAYOUT_IDEMPOTENCY_KEY_REUSED);
            }
            return payoutMapper.toResponse(existed.get());
        }

        //khoa vi truoc khi cong han muc ngay: 2 lenh rut cung luc khong vuot han muc
        walletService.lockedBalanceOf(WalletAccountRef.userAvailable(userId));

        Instant startOfDay = LocalDate.now(VIETNAM).atStartOfDay(VIETNAM).toInstant();
        long usedToday = walletPayoutRepository.sumAmountSince(userId, startOfDay,
                List.of(PayoutStatus.FAILED, PayoutStatus.CANCELLED));

        if (usedToday + amount > dailyLimit) {
            throw new AppException(ErrorCode.PAYOUT_LIMIT_EXCEEDED);
        }

        if (feeReceivableService.eligibilityOf(userId).getOutstandingFee() > 0) {
            throw new AppException(ErrorCode.PAYOUT_BLOCKED_BY_DEBT);
        }

        WalletPayout payout = walletPayoutRepository.saveAndFlush(WalletPayout.builder()
                .payoutCode(paymentCodeGenerator.generatePayout())
                .userId(userId)
                .amount(amount)
                .bankCode(request.getBankCode().trim())
                .accountNumber(request.getAccountNumber().trim())
                .accountName(request.getAccountName().trim())
                .idempotencyKey(idempotencyKey)
                .build());

        payout.setHoldTransactionId(post("PAYOUT_HOLD:", WalletPostingType.PAYOUT_HOLD, payout,
                WalletAccountRef.userAvailable(userId), WalletAccountRef.payoutPending(userId)));

        log.info("Payout {} requested by user {}, amount {}", payout.getPayoutCode(), userId, amount);

        return payoutMapper.toResponse(walletPayoutRepository.save(payout));
    }

    @Transactional
    public PayoutResponse cancel(UUID payoutId) {

        WalletPayout payout = walletPayoutRepository.findByIdForUpdate(payoutId)
                .filter(found -> found.getUserId().equals(tokenUtils.getCurrentUserId()))
                .orElseThrow(() -> new AppException(ErrorCode.PAYOUT_NOT_FOUND));

        transition(payout, PayoutStatus.CANCELLED);
        payout.setSettleTransactionId(returnToWallet(payout));
        payout.setFinishedAt(Instant.now());

        return payoutMapper.toResponse(walletPayoutRepository.save(payout));
    }

    @Transactional(readOnly = true)
    public List<PayoutResponse> getMyPayouts() {

        return walletPayoutRepository.findAllByUserIdOrderByCreatedAtDesc(tokenUtils.getCurrentUserId()).stream()
                .map(payoutMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<PayoutResponse> getByStatus(PayoutStatus status) {

        return walletPayoutRepository.findAllByStatusOrderByCreatedAtAsc(status).stream()
                .map(payoutMapper::toResponse)
                .toList();
    }

    //ADMIN da gui lenh chuyen khoan ra ngan hang
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PayoutResponse markProcessing(UUID payoutId, PayoutActionRequest request) {

        assertReason(request);
        WalletPayout payout = lockPayout(payoutId);
        Map<String, Object> before = state(payout);

        transition(payout, PayoutStatus.PROCESSING);
        payout.setProcessingAt(Instant.now());

        return audited(payout, AdminActionType.PAYOUT_PROCESSING, request, before);
    }

    //chi ghi da chi khi co ma xac nhan cua ngan hang / doi tac, khong chi vi ADMIN bam duyet
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PayoutResponse markPaid(UUID payoutId, PayoutActionRequest request) {

        assertReason(request);
        if (isBlank(request.getExternalReference())) {
            throw new AppException(ErrorCode.PAYOUT_REFERENCE_REQUIRED);
        }

        WalletPayout payout = lockPayout(payoutId);

        //bam lai cung ma xac nhan sau timeout: tra ket qua cu, khong ghi but toan lan 2
        if (payout.getStatus() == PayoutStatus.PAID && request.getExternalReference().equals(payout.getExternalReference())) {
            return payoutMapper.toResponse(payout);
        }

        Map<String, Object> before = state(payout);

        transition(payout, PayoutStatus.PAID);
        payout.setExternalReference(request.getExternalReference());
        payout.setSettleTransactionId(post("PAYOUT_PAID:", WalletPostingType.PAYOUT_PAID, payout,
                WalletAccountRef.payoutPending(payout.getUserId()), WalletAccountRef.externalClearing()));
        payout.setFinishedAt(Instant.now());

        return audited(payout, AdminActionType.PAYOUT_PAID, request, before);
    }

    //ngan hang tra ve / tu choi: tien ve lai vi user
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PayoutResponse markFailed(UUID payoutId, PayoutActionRequest request) {

        assertReason(request);
        WalletPayout payout = lockPayout(payoutId);

        //UNKNOWN chi duoc tra tien lai khi co bang chung ngan hang khong chi
        if (payout.getStatus() == PayoutStatus.UNKNOWN && isBlank(request.getExternalReference())) {
            throw new AppException(ErrorCode.PAYOUT_REFERENCE_REQUIRED);
        }

        Map<String, Object> before = state(payout);

        transition(payout, PayoutStatus.FAILED);
        payout.setFailureReason(request.getReason());
        payout.setExternalReference(request.getExternalReference());
        payout.setSettleTransactionId(returnToWallet(payout));
        payout.setFinishedAt(Instant.now());

        return audited(payout, AdminActionType.PAYOUT_FAILED, request, before);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PayoutResponse markUnknown(UUID payoutId, PayoutActionRequest request) {

        assertReason(request);
        WalletPayout payout = lockPayout(payoutId);
        Map<String, Object> before = state(payout);

        transition(payout, PayoutStatus.UNKNOWN);

        return audited(payout, AdminActionType.PAYOUT_UNKNOWN, request, before);
    }

    //job: dang chuyen qua lau chua co ket qua -> cho doi soat, khong tu tra tien lai
    @Transactional
    public void markUnknownIfStale(UUID payoutId) {

        WalletPayout payout = lockPayout(payoutId);

        if (payout.getStatus() != PayoutStatus.PROCESSING) return;

        transition(payout, PayoutStatus.UNKNOWN);
        walletPayoutRepository.save(payout);
        log.warn("Payout {} has no bank result, wait for reconciliation", payout.getPayoutCode());
    }

    //=====================================

    private UUID returnToWallet(WalletPayout payout) {

        return post("PAYOUT_RETURN:", WalletPostingType.PAYOUT_RETURN, payout,
                WalletAccountRef.payoutPending(payout.getUserId()), WalletAccountRef.userAvailable(payout.getUserId()));
    }

    private UUID post(String keyPrefix, WalletPostingType type, WalletPayout payout,
                      WalletAccountRef from, WalletAccountRef to) {

        return walletService.post(WalletPostingCommand.builder()
                .idempotencyKey(keyPrefix + payout.getPayoutId())
                .postingType(type)
                .obligationId(payout.getPayoutId())
                .description(type + " " + payout.getPayoutCode())
                .legs(List.of(new WalletPostingLeg(from, -payout.getAmount()),
                        new WalletPostingLeg(to, payout.getAmount())))
                .build()).walletTransactionId();
    }

    private PayoutResponse audited(WalletPayout payout, AdminActionType action, PayoutActionRequest request,
                                   Map<String, Object> before) {

        walletPayoutRepository.save(payout);

        adminAuditService.record(AdminAction.builder()
                .action(action)
                .targetType("PAYOUT")
                .targetId(payout.getPayoutId())
                .reason(request.getReason())
                .beforeState(before)
                .afterState(state(payout))
                .build());

        return payoutMapper.toResponse(payout);
    }

    private Map<String, Object> state(WalletPayout payout) {

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("status", payout.getStatus());
        state.put("amount", payout.getAmount());
        state.put("externalReference", payout.getExternalReference());
        return state;
    }

    private void transition(WalletPayout payout, PayoutStatus toStatus) {

        if (!payout.getStatus().canTransitionTo(toStatus)) {
            throw new AppException(ErrorCode.PAYOUT_INVALID_STATUS);
        }

        payout.setStatus(toStatus);
        payout.setUpdatedAt(Instant.now());
    }

    private WalletPayout lockPayout(UUID payoutId) {

        return walletPayoutRepository.findByIdForUpdate(payoutId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYOUT_NOT_FOUND));
    }

    private void assertReason(PayoutActionRequest request) {

        if (request == null || isBlank(request.getReason())) {
            throw new AppException(ErrorCode.PAYOUT_REFERENCE_REQUIRED);
        }
    }

    private long toWholeVnd(BigDecimal amount) {

        if (amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 0) {
            throw new AppException(ErrorCode.PAYOUT_INVALID);
        }

        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            throw new AppException(ErrorCode.PAYOUT_INVALID);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
