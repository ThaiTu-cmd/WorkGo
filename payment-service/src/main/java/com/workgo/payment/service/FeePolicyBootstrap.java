package com.workgo.payment.service;

import com.workgo.payment.entity.FeePolicyVersion;
import com.workgo.payment.reppository.FeePolicyVersionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

//WG-POLICY-1.0: thanh cong 10%, huy co loi min(2%, 100.000d); chi tao khi chua co phien ban nao
@Component
@ConditionalOnProperty(name = "payment.fee-policy.bootstrap-enabled", havingValue = "true")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FeePolicyBootstrap implements ApplicationRunner {

    FeePolicyVersionRepository feePolicyVersionRepository;

    @Override
    public void run(ApplicationArguments args) {

        if (feePolicyVersionRepository.count() > 0) return;

        try {
            feePolicyVersionRepository.saveAndFlush(FeePolicyVersion.builder()
                    .versionNo(1)
                    .successFeeRate(new BigDecimal("0.1000"))
                    .cancellationFeeRate(new BigDecimal("0.0200"))
                    .cancellationFeeCap(100_000L)
                    .effectiveFrom(Instant.EPOCH)
                    .reason("WG-POLICY-1.0 default")
                    .build());
            log.info("Default fee policy version 1 created");
        } catch (DataIntegrityViolationException e) {
            log.info("Default fee policy was created by another instance");
        }
    }
}
