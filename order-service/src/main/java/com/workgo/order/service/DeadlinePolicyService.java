package com.workgo.order.service;

import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.*;
import com.workgo.order.reppository.*;
import com.workgo.order.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class DeadlinePolicyService {
    private final OrderRepository orders;
    private final OrderTimerStateRepository timers;
    private final OrderTimerReceiptRepository receipts;
    private final OrderTimerNoticeRepository notices;
    private final TokenUtils token;
    private final Clock clock;

    public record PauseCommand(String sourceType,UUID sourceId,Long expectedVersion) {}
    public record ResumeCommand(String sourceType,UUID sourceId,UUID resumeCommandId,boolean requireNewDelivery,Long expectedVersion) {}
    public record TimerAck(UUID orderId,UUID commandId,long timerVersion,boolean paused,Instant resumeAt,boolean requiresNewDelivery) {}
    public record ExtensionCommand(long expectedVersion) {}
    private long window(Order o) { return Duration.ofHours(o.getExecutionType()==ExecutionType.ONSITE?24:72).toSeconds(); }
    private long floor(Order o) { return Duration.ofHours(o.getExecutionType()==ExecutionType.ONSITE?6:24).toSeconds(); }
    private Order load(UUID id) { return orders.findByIdForUpdate(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND)); }
    private void active(Order o) {
        if(o.getOrderStatus()==OrderStatus.COMPLETED||o.getOrderStatus()==OrderStatus.CANCELLED)
            throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);
    }
    private String source(String type,UUID id) {
        if(type==null||id==null||!Set.of("INPUT","REVISION","PREVIEW","DISPUTE","EVIDENCE","TIMER_ERROR").contains(type))
            throw new AppException(ErrorCode.ORDER_TIMER_INVALID);
        return type+":"+id;
    }
    private OrderTimerState state(Order o) {
        return timers.findById(o.getOrderId()).orElseGet(()->{
            var s=new OrderTimerState();s.setOrderId(o.getOrderId());
            if(o.getAutoCompleteAt()!=null){
                s.setDueAt(o.getAutoCompleteAt());s.setStartedAt(s.getDueAt().minusSeconds(window(o)));
                s.setSubmissionId("legacy:"+s.getStartedAt());
                s.setRemainingSeconds(Math.max(0,Duration.between(clock.instant(),s.getDueAt()).getSeconds()));
            }
            return timers.save(s);
        });
    }
    private void save(Order o,OrderTimerState s) {
        s.setTimerVersion(s.getTimerVersion()+1);
        o.setAutoCompleteAt(s.getAcceptedAt()==null&&s.getPauses().isEmpty()&&!s.isRequiresNewDelivery()?s.getDueAt():null);
        timers.save(s);orders.save(o);
    }
    private TimerAck ack(OrderTimerState s,UUID command) {
        return new TimerAck(s.getOrderId(),command,s.getTimerVersion(),!s.getPauses().isEmpty()||s.isRequiresNewDelivery(),
                s.getDueAt(),s.isRequiresNewDelivery());
    }

    /** Called only after immutable delivery/evidence has passed the READY guards. */
    @Transactional
    public void submitted(Order o,String submissionId) {
        active(o);var s=state(o);Instant now=clock.instant();
        if(Objects.equals(submissionId,s.getSubmissionId()))return;
        s.setSubmissionId(submissionId);s.setStartedAt(now);s.setRemainingSeconds(window(o));
        s.setRequiresNewDelivery(false);s.setExtensionUsed(false);s.setNotificationAckAt(null);s.setAcceptedAt(null);
        // A new delivery closes repair pauses, never another dispute or preview.
        var repairs=s.getPauses().keySet().stream().filter(k->k.startsWith("REVISION:")||k.startsWith("EVIDENCE:")).toList();
        for(var key:repairs)release(s,key,now);
        if(s.getPauses().isEmpty()){
            closePause(s,now);s.setDueAt(now.plusSeconds(window(o)));
        }else{s.setDueAt(null);if(s.getPausedAt()==null)s.setPausedAt(now);}
        save(o,s);enqueue(o,s,"START");
    }
    @Transactional
    public TimerAck pause(UUID id,String type,UUID sourceId,Long expectedVersion) {
        Order o=load(id);active(o);var s=state(o);String key=source(type,sourceId);
        if(s.getReleased().contains(key)||s.getPauses().containsKey(key))return ack(s,null);
        if(expectedVersion!=null&&expectedVersion!=s.getTimerVersion())throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);
        Instant now=clock.instant();
        if(s.getPauses().isEmpty()){
            s.setRemainingSeconds(s.getDueAt()==null?s.getRemainingSeconds():Math.max(0,Duration.between(now,s.getDueAt()).getSeconds()));
            s.setPausedAt(now);
        }
        s.getPauses().put(key,now);s.setDueAt(null);save(o,s);return ack(s,null);
    }
    @Transactional
    public TimerAck resume(UUID id,String type,UUID sourceId,UUID commandId,boolean requireNewDelivery) {
        return resume(id,type,sourceId,commandId,requireNewDelivery,null);
    }
    @Transactional
    public TimerAck resume(UUID id,String type,UUID sourceId,UUID commandId,boolean requireNewDelivery,Long expectedVersion) {
        Order o=load(id);String key=source(type,sourceId);
        if(commandId==null)throw new AppException(ErrorCode.ORDER_TIMER_INVALID);
        var old=receipts.findById(commandId).orElse(null);
        if(old!=null){
            if(!id.equals(old.getOrderId())||!key.equals(old.getSourceKey())||requireNewDelivery!=old.isRequireNewDelivery()
                    ||!Objects.equals(expectedVersion,old.getExpectedVersion()))
                throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);
            return new TimerAck(id,commandId,old.getTimerVersion(),old.isPaused(),old.getResumeAt(),old.isRequiresNewDelivery());
        }
        active(o);var s=state(o);Instant now=clock.instant();
        if(expectedVersion!=null&&expectedVersion!=s.getTimerVersion())throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);
        if(!s.getReleased().contains(key)){
            // Resume before pause is a durable tombstone and still grants the review minimum.
            if(s.getPauses().isEmpty()&&s.getDueAt()!=null)
                s.setRemainingSeconds(Math.max(0,Duration.between(now,s.getDueAt()).getSeconds()));
            release(s,key,now);
            s.setRequiresNewDelivery(s.isRequiresNewDelivery()||requireNewDelivery);
            s.setRemainingSeconds(Math.max(s.getRemainingSeconds(),floor(o)));
            if(s.getPauses().isEmpty()){
                closePause(s,now);
                s.setDueAt(s.getAcceptedAt()!=null||s.isRequiresNewDelivery()||s.getSubmissionId()==null?null:now.plusSeconds(s.getRemainingSeconds()));
            }
            save(o,s);
        }
        var result=ack(s,commandId);var receipt=new OrderTimerReceipt();
        receipt.setCommandId(commandId);receipt.setOrderId(id);receipt.setSourceKey(key);receipt.setRequireNewDelivery(requireNewDelivery);receipt.setExpectedVersion(expectedVersion);
        receipt.setTimerVersion(result.timerVersion());receipt.setPaused(result.paused());receipt.setResumeAt(result.resumeAt());
        receipt.setRequiresNewDelivery(result.requiresNewDelivery());receipts.saveAndFlush(receipt);return result;
    }
    private void release(OrderTimerState s,String key,Instant now){
        Instant start=s.getPauses().remove(key);s.getReleased().add(key);
        if(start!=null)s.getPauseDurations().put(key,Math.max(0,Duration.between(start,now).getSeconds()));
    }
    private void closePause(OrderTimerState s,Instant now){
        if(s.getPausedAt()!=null){s.setTotalPausedSeconds(s.getTotalPausedSeconds()+Math.max(0,Duration.between(s.getPausedAt(),now).getSeconds()));s.setPausedAt(null);}
    }
    @Transactional
    public TimerAck extend(UUID id,long expectedVersion){
        Order o=load(id);token.assertParticipant(o);
        if(!Objects.equals(o.getClientId(),token.getCurrentUserId()))throw new AppException(ErrorCode.FORBIDDEN);
        var s=state(o);
        if(o.getOrderStatus()!=OrderStatus.DELIVERED||s.getTimerVersion()!=expectedVersion||s.isExtensionUsed()
                ||s.getDueAt()==null||!s.getDueAt().isAfter(clock.instant())||!s.getPauses().isEmpty()||s.isRequiresNewDelivery())
            throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);
        s.setDueAt(s.getDueAt().plusSeconds(window(o)));s.setExtensionUsed(true);save(o,s);return ack(s,null);
    }
    @Transactional
    public TimerAck status(UUID id){Order o=load(id);token.assertParticipant(o);return ack(state(o),null);}
    @Transactional
    public boolean requiresNewDelivery(Order o){return state(o).isRequiresNewDelivery();}

    /** Legacy deadlines must also receive a durable notification before auto acceptance. */
    @Transactional
    public boolean eligible(Order o){
        var s=state(o);
        if(s.getSubmissionId()==null||s.getAcceptedAt()!=null||s.isRequiresNewDelivery()||!s.getPauses().isEmpty()||s.getDueAt()==null)return false;
        enqueue(o,s,"START");
        long[] hours=o.getExecutionType()==ExecutionType.ONSITE?new long[]{6,1}:new long[]{24,6};
        for(long h:hours)if(!clock.instant().isBefore(s.getDueAt().minus(Duration.ofHours(h))))enqueue(o,s,"BEFORE_"+h+"H");
        return s.getNotificationAckAt()!=null&&!notices.existsByOrderIdAndSubmissionIdAndAcknowledgedAtIsNullAndObsoleteFalse(o.getOrderId(),s.getSubmissionId())
                &&!s.getDueAt().isAfter(clock.instant());
    }
    @Transactional
    public void assertCanAccept(Order o){
        var s=state(o);if(!s.getPauses().isEmpty()||s.isRequiresNewDelivery())throw new AppException(ErrorCode.ORDER_TIMER_CONFLICT);
    }
    @Transactional
    public void accepted(Order o){
        var s=state(o);s.setAcceptedAt(clock.instant());s.setDueAt(null);s.setRemainingSeconds(0);save(o,s);
    }
    @Transactional
    public void pauseForError(Order o,String type){
        var s=state(o);
        if(s.getPauses().keySet().stream().noneMatch(k->k.startsWith(type+":")))pause(o.getOrderId(),type,UUID.randomUUID(),null);
    }
    private void enqueue(Order o,OrderTimerState s,String phase){
        String type="ORDER_REVIEW_"+phase;
        // A rescheduled deadline gets its own reminders, while START stays per submission.
        UUID id=UUID.nameUUIDFromBytes((o.getOrderId()+":"+s.getSubmissionId()+":"+type+("START".equals(phase)?"":":"+s.getDueAt())).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if(notices.existsById(id))return;
        var n=new OrderTimerNotice();n.setId(id);n.setOrderId(o.getOrderId());n.setRecipientId(o.getClientId());
        n.setSubmissionId(s.getSubmissionId());n.setType(type);n.setDeadlineAt(s.getDueAt());n.setNextAttemptAt(clock.instant());notices.save(n);
    }
}

