package com.workgo.order.service;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.OrderNotificationClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class OrderInputSupportService {
    private final OrderRepository orders;
    private final OrderInputChecklistRepository checklists;
    private final OrderInputNoticeRepository notices;
    private final OrderNotificationClient notifications;
    private final Clock clock;

    @Transactional
    public void assess(UUID orderId) {
        Order order=orders.findByIdForUpdate(orderId).orElse(null);
        if (order==null || order.getOrderStatus()!=OrderStatus.CONFIRMED) return;
        Instant now=clock.instant();
        var row=checklists.findTopByOrderIdOrderByChecklistVersionDesc(orderId).orElse(null);
        // Missing checklist is also visible to ADMIN after 7 days; no invented no-input consent.
        if (row==null) {
            if (!now.isBefore(order.getConfirmedAt().plus(Duration.ofDays(7)))) {
                order.setInputSupportReason("CHECKLIST_NOT_AGREED"); orders.save(order);
            }
            return;
        }
        if (row.getAcceptedAt()!=null) return;
        if (row.getResponseDueAt()!=null && !now.isBefore(row.getResponseDueAt())) {
            escalate(order,row,"PROVIDER_RESPONSE_OVERDUE",now); return;
        }
        Instant waitingSince=order.getConfirmedAt();
        if (row.getClientConfirmedAt()!=null && row.getClientConfirmedAt().isAfter(waitingSince)) waitingSince=row.getClientConfirmedAt();
        if (!now.isBefore(waitingSince.plus(Duration.ofDays(7)))) escalate(order,row,"INPUTS_OVERDUE_7D",now);
        if (row.getResponseDueAt()==null) {
            if (row.getReminder24At()==null && !now.isBefore(waitingSince.plus(Duration.ofHours(24)))) {
                enqueue(order,row,"ORDER_INPUT_REMINDER_24H",now); row.setReminder24At(now);
            }
            if (row.getReminder72At()==null && !now.isBefore(waitingSince.plus(Duration.ofHours(72)))) {
                enqueue(order,row,"ORDER_INPUT_REMINDER_72H",now); row.setReminder72At(now);
            }
        }
        checklists.save(row);
    }
    private void escalate(Order o,OrderInputChecklist r,String reason,Instant now) {
        if (r.getEscalatedAt()==null) r.setEscalatedAt(now);
        o.setInputSupportReason(reason); orders.save(o); checklists.save(r);
    }
    private void enqueue(Order o,OrderInputChecklist r,String type,Instant now) {
        UUID id=UUID.nameUUIDFromBytes((o.getOrderId()+":"+r.getChecklistVersion()+":"+type).getBytes(StandardCharsets.UTF_8));
        if (!notices.existsById(id)) notices.save(OrderInputNotice.builder().id(id).orderId(o.getOrderId())
                .recipientId(o.getClientId()).type(type).nextAttemptAt(now).build());
    }
    @Transactional
    public void deliver(UUID id) {
        var row=notices.lock(id).orElse(null);
        if (row==null || row.getAcknowledgedAt()!=null || row.getNextAttemptAt().isAfter(clock.instant())) return;
        row.setAttempts(row.getAttempts()+1);
        try {
            var response=notifications.send(new OrderNotificationClient.Notice(row.getId().toString(),row.getRecipientId(),row.getType(),
                    "Order inputs required","Please provide or confirm the agreed inputs. Contact support if you need help.","ORDER",row.getOrderId()));
            var ack=response==null?null:response.getResult();
            if (ack!=null && ack.id()!=null && row.getRecipientId().equals(ack.recipientId()) && row.getType().equals(ack.type())
                    && "ORDER".equals(ack.referenceType()) && row.getOrderId().equals(ack.referenceId())) row.setAcknowledgedAt(clock.instant());
        } catch (RuntimeException ignored) { /* stable eventId makes retry after lost ACK safe */ }
        row.setNextAttemptAt(clock.instant().plusSeconds(Math.min(3600,60L*row.getAttempts())));
        notices.save(row);
    }
    @Transactional(readOnly=true) @PreAuthorize("hasRole('ADMIN')")
    public Page<SupportItem> queue(int page,int size) {
        return orders.findByInputSupportReasonIsNotNullAndOrderStatus(OrderStatus.CONFIRMED,
                PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size)),Sort.by("confirmedAt")))
                .map(o->new SupportItem(o.getOrderId(),o.getInputSupportReason(),o.getConfirmedAt()));
    }
    public record SupportItem(UUID orderId,String reason,Instant confirmedAt) {}
}
