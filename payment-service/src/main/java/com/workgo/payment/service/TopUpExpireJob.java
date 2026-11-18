package com.workgo.payment.service;

import com.workgo.payment.entity.WalletTopUp;
import com.workgo.payment.enumeration.TopUpStatus;
import com.workgo.payment.reppository.WalletTopUpRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class TopUpExpireJob {

    WalletTopUpRepository walletTopUpRepository;
    TopUpService topUpService;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<WalletTopUp> topUps = walletTopUpRepository
                .findAllByStatusAndExpiresAtBefore(TopUpStatus.PENDING, Instant.now());

        for (WalletTopUp topUp : topUps) {
            try {
                topUpService.markUnknownIfExpired(topUp.getTopUpId());
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Top-up {} was updated by another request, skip", topUp.getTopUpCode());
            } catch (Exception e) {
                log.warn("Mark top-up {} unknown failed", topUp.getTopUpCode(), e);
            }
        }
    }

}
