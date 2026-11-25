package com.workgo.order.service;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.reppository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.PageRequest;
import java.time.Clock;
@Component @RequiredArgsConstructor @Slf4j
public class OrderInputJob {
    private final OrderRepository orders;
    private final OrderInputNoticeRepository notices;
    private final OrderInputSupportService support;
    private final Clock clock;
    @Scheduled(fixedDelay=60000)
    public void run() {
        // Bounded pages include orders without any checklist, and do not starve later pages.
        int page=0;
        org.springframework.data.domain.Page<com.workgo.order.entity.Order> batch;
        do {
            batch=orders.findByOrderStatus(OrderStatus.CONFIRMED,PageRequest.of(page++,100,org.springframework.data.domain.Sort.by("orderId")));
            for (var order:batch) try { support.assess(order.getOrderId()); }
                catch (RuntimeException e) { log.warn("Input SLA assessment failed for {}",order.getOrderId(),e); }
        } while (batch.hasNext());
        for (var notice:notices.findTop50ByAcknowledgedAtIsNullAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(clock.instant()))
            try { support.deliver(notice.getId()); }
            catch (RuntimeException e) { log.warn("Input reminder delivery failed for {}",notice.getId(),e); }
    }
}
