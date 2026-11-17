package com.workgo.trust.service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor @Slf4j
public class ReviewPublicationWorker {
    private final ReviewService reviews;
    @Value("${app.workers.enabled:true}") private boolean enabled;
    @Scheduled(cron="${app.review.publication-cron:0 */5 * * * *}")
    public void scheduled() { if (enabled) publishDue(); }
    public void publishDue() {
        for (var order : reviews.dueOrders()) {
            try { reviews.publishDueOrder(order); }
            catch (RuntimeException e) { log.warn("Review publication deferred for order {} ({})",order,e.getClass().getSimpleName()); }
        }
    }
}
