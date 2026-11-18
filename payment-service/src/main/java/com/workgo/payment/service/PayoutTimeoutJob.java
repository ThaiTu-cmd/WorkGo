package com.workgo.payment.service;

import com.workgo.payment.entity.WalletPayout;
import com.workgo.payment.enumeration.PayoutStatus;
import com.workgo.payment.reppository.WalletPayoutRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PayoutTimeoutJob {

    WalletPayoutRepository walletPayoutRepository;
    PayoutService payoutService;

    @NonFinal
    @Value("${payment.payout.unknown-after-hours:24}")
    long unknownAfterHours;

    @Scheduled(fixedDelay = 300_000)
    public void run() {

        List<WalletPayout> payouts = walletPayoutRepository.findAllByStatusAndProcessingAtBefore(
                PayoutStatus.PROCESSING, Instant.now().minus(Duration.ofHours(unknownAfterHours)));

        for (WalletPayout payout : payouts) {
            try {
                payoutService.markUnknownIfStale(payout.getPayoutId());
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Payout {} was updated by another request, skip", payout.getPayoutCode());
            } catch (Exception e) {
                log.warn("Mark payout {} unknown failed", payout.getPayoutCode(), e);
            }
        }
    }

}
