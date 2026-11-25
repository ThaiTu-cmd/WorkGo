package com.workgo.payment.service;

import com.workgo.payment.reppository.FeeReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Instant;

@Component @RequiredArgsConstructor @Slf4j
public class FeeReminderJob {
    private final FeeReminderRepository reminders;
    private final FeeReminderService service;
    @Scheduled(fixedDelayString = "${payment.fee-reminders.delay-ms:60000}")
    public void run() {
        for (var reminder : reminders.findByDeliveredAtIsNullAndCancelledAtIsNullAndDueAtLessThanEqualOrderByDueAtAsc(
                Instant.now(), PageRequest.of(0, 100))) {
            try { service.deliver(reminder.getId()); }
            catch (Exception e) { log.warn("Fee reminder {} remains pending: {}", reminder.getId(), e.toString()); }
        }
    }
}
