package com.workgo.job.configuration;

import com.workgo.job.service.ProposalOrderWorker;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration @EnableScheduling @RequiredArgsConstructor
@ConditionalOnProperty(name = "app.outbox.scheduling-enabled", havingValue = "true", matchIfMissing = true)
public class OutboxSchedulingConfiguration {
    private final ProposalOrderWorker worker;

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:5000}")
    public void deliverOrders() { worker.processDue(); }
}
