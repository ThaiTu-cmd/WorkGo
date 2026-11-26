package com.workgo.payment.service;

import com.workgo.payment.dto.request.FeePolicyCreationRequest;
import com.workgo.payment.dto.response.FeePolicyResponse;
import com.workgo.payment.entity.FeePolicyVersion;
import com.workgo.payment.enumeration.AdminActionType;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.mapper.FeePolicyMapper;
import com.workgo.payment.reppository.FeePolicyVersionRepository;
import com.workgo.payment.service.admin.AdminAction;
import com.workgo.payment.service.admin.AdminAuditService;
import com.workgo.payment.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FeePolicyService {

    static BigDecimal MAX_RATE = new BigDecimal("0.5");

    FeePolicyVersionRepository feePolicyVersionRepository;
    FeePolicyMapper feePolicyMapper;
    AdminAuditService adminAuditService;
    TokenUtils tokenUtils;

    @Transactional(readOnly=true) public FeePolicyResponse getVersion(UUID id){return feePolicyMapper.toResponse(loadForOrder(id));}

    //chi tao phien ban moi, khong sua phien ban cu; order da chot giu snapshot phien ban cu
    @Transactional
    public FeePolicyResponse createVersion(FeePolicyCreationRequest request) {

        Instant now = Instant.now();
        Instant effectiveFrom = request.getEffectiveFrom() == null ? now : request.getEffectiveFrom();

        if (request.getReason() == null || request.getReason().isBlank()
                || !validRate(request.getSuccessFeeRate()) || !validRate(request.getCancellationFeeRate())
                || request.getCancellationFeeCap() == null || request.getCancellationFeeCap().signum() < 0
                || request.getCancellationFeeCap().stripTrailingZeros().scale() > 0
                || effectiveFrom.isBefore(now.minusSeconds(60))) {
            throw new AppException(ErrorCode.FEE_POLICY_INVALID);
        }

        FeePolicyResponse before = feePolicyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(now).map(feePolicyMapper::toResponse).orElse(null);
        int versionNo = feePolicyVersionRepository.findTopByOrderByVersionNoDesc()
                .map(FeePolicyVersion::getVersionNo)
                .orElse(0) + 1;

        FeePolicyVersion version = feePolicyVersionRepository.saveAndFlush(FeePolicyVersion.builder()
                .versionNo(versionNo)
                .successFeeRate(request.getSuccessFeeRate())
                .cancellationFeeRate(request.getCancellationFeeRate())
                .cancellationFeeCap(request.getCancellationFeeCap().longValueExact())
                .effectiveFrom(effectiveFrom)
                .reason(request.getReason())
                .createdBy(tokenUtils.getCurrentUserId())
                .build());

        FeePolicyResponse after = feePolicyMapper.toResponse(version);

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.FEE_POLICY_CREATED)
                .targetType("FEE_POLICY")
                .targetId(version.getFeePolicyVersionId())
                .reason(request.getReason())
                .beforeState(before)
                .afterState(after)
                .build());

        log.info("Fee policy version {} created, effective from {}", versionNo, effectiveFrom);

        return after;
    }

    @Transactional(readOnly = true)
    public List<FeePolicyResponse> getVersions() {

        return feePolicyVersionRepository.findAllByOrderByVersionNoDesc().stream()
                .map(feePolicyMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeePolicyResponse getCurrent() {
        return feePolicyMapper.toResponse(loadEffective(Instant.now()));
    }

    //phien ban da chot cua order; order truoc viec 24 chua co thi theo phien ban 1
    @Transactional(readOnly = true)
    public FeePolicyVersion loadForOrder(UUID feePolicyVersionId) {

        return (feePolicyVersionId == null
                ? feePolicyVersionRepository.findByVersionNo(1)
                : feePolicyVersionRepository.findById(feePolicyVersionId))
                .orElseThrow(() -> new AppException(ErrorCode.FEE_POLICY_NOT_FOUND));
    }

    //HALF_UP den 1d; phi huy lam tron roi moi ap tran
    public long successFee(FeePolicyVersion policy, long amount) {
        return BigDecimal.valueOf(amount).multiply(policy.getSuccessFeeRate())
                .setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    public long cancellationFee(FeePolicyVersion policy, long amount) {
        long fee = BigDecimal.valueOf(amount).multiply(policy.getCancellationFeeRate())
                .setScale(0, RoundingMode.HALF_UP).longValueExact();
        return Math.min(fee, policy.getCancellationFeeCap());
    }

    //=====================================

    private FeePolicyVersion loadEffective(Instant at) {

        return feePolicyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(at)
                .orElseThrow(() -> new AppException(ErrorCode.FEE_POLICY_NOT_FOUND));
    }

    private boolean validRate(BigDecimal rate) {

        return rate != null && rate.signum() >= 0 && rate.compareTo(MAX_RATE) <= 0
                && rate.stripTrailingZeros().scale() <= 4;
    }
}
