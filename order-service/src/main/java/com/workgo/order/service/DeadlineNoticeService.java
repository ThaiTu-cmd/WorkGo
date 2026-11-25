package com.workgo.order.service;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.OrderNotificationClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.UUID;
@Service @RequiredArgsConstructor
public class DeadlineNoticeService {
    private final OrderRepository orders;
    private final OrderTimerStateRepository timers;
    private final OrderTimerNoticeRepository notices;
    private final OrderNotificationClient notifications;
    private final DeadlinePolicyService policy;
    private final ExecutionRepository executions;
    private final DeliveryReadinessService readiness;
    private final TrustDisputeGuard trust;
    private final Clock clock;
    @Transactional
    public void assess(UUID id){var o=orders.findByIdForUpdate(id).orElse(null);
        if(o==null||o.getOrderStatus()!=com.workgo.order.enumeration.OrderStatus.DELIVERED)return;
        if(timers.findById(id).map(t->t.getAcceptedAt()!=null).orElse(false))return;
        if(!trust.permitsPaymentSync(id)){policy.pauseForError(o,"TIMER_ERROR");return;}
        var execution=executions.findByOrder_OrderId(id).orElse(null);
        boolean ready=execution!=null&&readiness.ready(o,execution);
        if(!ready)policy.pauseForError(o,"EVIDENCE");
        var timer=timers.findById(id).orElse(null);
        if(timer!=null)for(String key:java.util.List.copyOf(timer.getPauses().keySet())){
            if(key.startsWith("TIMER_ERROR:")||ready&&key.startsWith("EVIDENCE:")){
                String[] parts=key.split(":",2);
                UUID command=UUID.nameUUIDFromBytes(("recover:"+id+":"+key).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                policy.resume(id,parts[0],UUID.fromString(parts[1]),command,false);
            }
        }
        if(ready)policy.eligible(o);
    }
    @Transactional
    public void deliver(UUID id){
        var candidate=notices.findById(id).orElse(null);if(candidate==null)return;
        var order=orders.findByIdForUpdate(candidate.getOrderId()).orElse(null);
        var n=notices.findById(id).orElse(null);
        if(order==null||n==null||n.getAcknowledgedAt()!=null||n.getNextAttemptAt().isAfter(clock.instant()))return;
        var timer=timers.findById(n.getOrderId()).orElse(null);
        if(timer==null||timer.getAcceptedAt()!=null||!n.getSubmissionId().equals(timer.getSubmissionId())
                ||order.getOrderStatus()!=com.workgo.order.enumeration.OrderStatus.DELIVERED
                ||!"ORDER_REVIEW_START".equals(n.getType())&&timer.getDueAt()!=null&&!timer.getDueAt().equals(n.getDeadlineAt())){
            n.setObsolete(true);notices.save(n);return;
        }
        if(!timer.getPauses().isEmpty()||timer.isRequiresNewDelivery()){
            n.setNextAttemptAt(clock.instant().plusSeconds(60));notices.save(n);return;
        }
        n.setAttempts(n.getAttempts()+1);
        try{
            var response=notifications.send(new OrderNotificationClient.Notice(id.toString(),n.getRecipientId(),n.getType(),
                    "Order ready for review","Review the delivery before the deadline. You may request an extension, revision or support.","ORDER",n.getOrderId()));
            var ack=response==null?null:response.getResult();
            if(response!=null&&response.getCode()==1000&&ack!=null&&ack.id()!=null&&n.getRecipientId().equals(ack.recipientId())
                    &&n.getType().equals(ack.type())&&"ORDER".equals(ack.referenceType())&&n.getOrderId().equals(ack.referenceId())){
                n.setAcknowledgedAt(clock.instant());
                if("ORDER_REVIEW_START".equals(n.getType()))timer.setNotificationAckAt(clock.instant());
            }
        }catch(RuntimeException ignored){/* Stable event identity makes retries safe after a lost ACK. */}
        n.setNextAttemptAt(clock.instant().plusSeconds(Math.min(3600,60L*n.getAttempts())));
        notices.save(n);timers.save(timer);
    }
}
