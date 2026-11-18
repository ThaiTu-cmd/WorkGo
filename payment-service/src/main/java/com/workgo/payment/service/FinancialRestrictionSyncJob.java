package com.workgo.payment.service;

import com.workgo.payment.entity.FinancialRestriction;
import com.workgo.payment.reppository.FinancialRestrictionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class FinancialRestrictionSyncJob {

    FinancialRestrictionRepository financialRestrictionRepository;
    FinancialRestrictionService financialRestrictionService;

    @Scheduled(fixedDelay = 30_000)
    public void run() {

        for (FinancialRestriction state : financialRestrictionRepository.findAllPendingSync()) {
            try {
                financialRestrictionService.sync(state.getUserId());
            } catch (Exception e) {
                log.warn("Sync financial restriction of user {} failed", state.getUserId(), e);
            }
        }
    }

}
