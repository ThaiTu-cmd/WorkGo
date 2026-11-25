package com.workgo.order.service;


import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.reppository.OrderRepository;
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
public class PaymentTimeoutJob {

    OrderRepository orderRepository;
    OrderService orderService;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        int page=0;
        org.springframework.data.domain.Page<Order> orders;
        do {
            orders=orderRepository.findByOrderStatus(OrderStatus.PENDING_PAYMENT,
                    org.springframework.data.domain.PageRequest.of(page++,100,org.springframework.data.domain.Sort.by("orderId")));
            for (Order order:orders) {
                try { orderService.expireIfDue(order.getOrderId()); }
                catch (Exception e) { log.warn("Timeout cancel failed for order {}",order.getOrderId(),e); }
            }
        } while (orders.hasNext());
    }
}
