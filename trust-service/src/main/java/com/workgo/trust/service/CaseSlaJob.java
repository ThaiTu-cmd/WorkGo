package com.workgo.trust.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled worker evaluating dispute intake (24h) and decision (72h) SLAs (D05 / DEV-08).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CaseSlaJob {
    private final CaseSlaService slaService;
    @Value("${app.workers.enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${app.sla.poll-interval-ms:60000}", initialDelayString = "${app.sla.initial-delay-ms:15000}")
    public void scheduled() {
        if (enabled) {
            runOnce();
        }
    }

    public CaseSlaService.SlaScanResult runOnce() {
        var result = slaService.evaluateDueCases();
        if (result.intakeEscalated() > 0 || result.decisionEscalated() > 0) {
            log.info("Case SLA scan completed: intakeEscalated={}, decisionEscalated={}",
                    result.intakeEscalated(), result.decisionEscalated());
        }
        return result;
    }
}
