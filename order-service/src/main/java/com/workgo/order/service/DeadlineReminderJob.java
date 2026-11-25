package com.workgo.order.service;
import com.workgo.order.reppository.*;
import com.workgo.order.enumeration.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.*;
import java.time.Clock;
@Component @RequiredArgsConstructor @Slf4j
public class DeadlineReminderJob {
    private final OrderRepository orders;
    private final OrderTimerNoticeRepository notices;
    private final DeadlineNoticeService service;
    private final Clock clock;
    @Scheduled(fixedDelay=60000)
    public void run(){
        int page=0;Page<com.workgo.order.entity.Order> batch;
        do{
            batch=orders.findByOrderStatus(OrderStatus.DELIVERED,PageRequest.of(page++,100,Sort.by("orderId")));
            for(var o:batch)try{service.assess(o.getOrderId());}catch(RuntimeException e){log.warn("Timer assessment deferred {}",o.getOrderId());}
        }while(batch.hasNext());
        for(var n:notices.findTop50ByAcknowledgedAtIsNullAndObsoleteFalseAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(clock.instant()))
            try{service.deliver(n.getId());}catch(RuntimeException e){log.warn("Timer notification deferred {}",n.getId());}
    }
}
