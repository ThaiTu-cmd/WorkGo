package com.workgo.order.service;

import com.workgo.order.entity.*;
import com.workgo.order.entity.Order;
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
public class PreviewService {
    private final OrderRepository orders;
    private final PreviewSessionRepository sessions;
    private final PreviewEventRepository events;
    private final OrderTimerStateRepository timers;
    private final DeadlinePolicyService deadlines;
    private final TokenUtils token;
    private final Clock clock;

    public record Request(UUID requestKey,Long expectedOrderVersion,Instant scheduledAt) {}
    public record Command(long expectedVersion,String action,Instant scheduledAt,String note) {}
    public record Detail(PreviewSession session,List<PreviewEvent> events) {}
    private AppException conflict(){return new AppException(ErrorCode.PREVIEW_CONFLICT);}
    Order locked(UUID id,boolean admin){
        Order o=orders.findByIdForUpdate(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        if(!admin)token.assertParticipant(o);return o;
    }
    PreviewSession session(UUID orderId,UUID id){
        var p=sessions.findById(id).orElseThrow(this::conflict);
        if(!orderId.equals(p.getOrderId()))throw conflict();return p;
    }
    void active(Order o){
        if(o.getOrderStatus()!=OrderStatus.DELIVERED||o.getExecutionType()!=ExecutionType.DIGITAL)throw conflict();
    }
    private void schedule(Instant proposed,Instant cutoff){
        if(proposed==null||!proposed.isAfter(clock.instant())||proposed.isAfter(cutoff))throw new AppException(ErrorCode.PREVIEW_INVALID);
    }
    private void version(PreviewSession p,long expected){if(p.getVersion()!=expected)throw conflict();}
    private void note(String text){if(text==null||text.isBlank()||text.length()>2000)throw new AppException(ErrorCode.PREVIEW_INVALID);}
    void event(PreviewSession p,UUID actor,String type,String text){
        p.setVersion(p.getVersion()+1);
        var e=new PreviewEvent();e.setId(UUID.randomUUID());e.setPreviewId(p.getId());e.setActorId(actor);e.setType(type);
        e.setNote(text);e.setOccurredAt(clock.instant());e.setPreviewVersion(p.getVersion());events.save(e);sessions.saveAndFlush(p);
    }
    @Transactional public List<PreviewSession> list(UUID orderId){locked(orderId,false);return sessions.findByOrderIdOrderByCreatedAtAsc(orderId);}
    @Transactional public Detail get(UUID orderId,UUID id){locked(orderId,false);var p=session(orderId,id);return new Detail(p,events.findByPreviewIdOrderByOccurredAtAsc(id));}

    @Transactional public PreviewSession request(UUID orderId,Request r){
        Order o=locked(orderId,false);UUID actor=token.getCurrentUserId();
        if(r.requestKey()==null||r.expectedOrderVersion()==null)throw new AppException(ErrorCode.PREVIEW_INVALID);
        var old=sessions.findByOrderIdAndRequestKey(orderId,r.requestKey()).orElse(null);
        if(old!=null){
            // Immutable creation event preserves the original schedule even after a reschedule.
            var creation=events.findByPreviewIdOrderByOccurredAtAsc(old.getId()).stream().filter(e->e.getType().equals("REQUESTED")).findFirst().orElseThrow(this::conflict);
            if(!actor.equals(old.getRequesterId())||!Objects.equals(creation.getNote(),r.expectedOrderVersion()+":"+r.scheduledAt()))throw conflict();
            return old;
        }
        active(o);if(!Objects.equals(o.getVersion(),r.expectedOrderVersion())||sessions.existsByOrderIdAndActiveSlot(orderId,1))throw conflict();
        var timer=timers.findById(orderId).orElseThrow(this::conflict);
        if(timer.getSubmissionId()==null||timer.getAcceptedAt()!=null||timer.isRequiresNewDelivery()
                ||(timer.getDueAt()!=null&&!timer.getDueAt().isAfter(clock.instant())))throw conflict();
        Instant now=clock.instant();schedule(r.scheduledAt(),now.plus(Duration.ofHours(72)));
        var p=new PreviewSession();p.setId(UUID.randomUUID());p.setOrderId(orderId);p.setRequestKey(r.requestKey());
        p.setRequesterId(actor);p.setHostUserId(actor);p.setScheduleProposerId(actor);p.setSubmissionId(timer.getSubmissionId());
        p.setCreatedAt(now);p.setResponseDueAt(now.plus(Duration.ofHours(24)));p.setScheduleDueAt(now.plus(Duration.ofHours(72)));p.setScheduledAt(r.scheduledAt());
        boolean first=sessions.findByOrderIdOrderByCreatedAtAsc(orderId).isEmpty();
        if(first){deadlines.pause(orderId,"PREVIEW",p.getId(),null);p.setPauseActive(true);}
        sessions.save(p);event(p,actor,"REQUESTED",r.expectedOrderVersion()+":"+r.scheduledAt());return p;
    }
    @Transactional public PreviewSession command(UUID orderId,UUID id,Command c){
        Order o=locked(orderId,false);var p=session(orderId,id);active(o);version(p,c.expectedVersion());
        if(p.getActiveSlot()==null)throw conflict();
        UUID actor=token.getCurrentUserId();
        if(expire(p)){event(p,null,"ESCALATED",p.getLastError());return p;}
        if("CONTACT".equals(c.action())){
            note(c.note());event(p,actor,"CONTACT",c.note());return p;
        }
        if("SUPPORT_REQUIRED".equals(p.getStatus())&&!Set.of("RESCHEDULE","CANCEL").contains(c.action()==null?"":c.action()))throw conflict();
        switch(c.action()==null?"":c.action()){
            case "CONFIRM" -> {
                if(!"REQUESTED".equals(p.getStatus())||actor.equals(p.getScheduleProposerId()))throw conflict();
                schedule(p.getScheduledAt(),p.getScheduleDueAt());
                var timer=timers.findById(orderId).orElseThrow(this::conflict);
                if(!Objects.equals(p.getSubmissionId(),timer.getSubmissionId()))throw conflict();
                p.setStatus("CONFIRMED");
                if(!p.isPauseActive()){deadlines.pause(orderId,"PREVIEW",id,null);p.setPauseActive(true);}
            }
            case "RESCHEDULE" -> {
                note(c.note());schedule(c.scheduledAt(),p.getScheduleDueAt());
                p.setScheduleProposerId(actor);p.setScheduledAt(c.scheduledAt());p.setStatus("REQUESTED");
                p.setResponseDueAt(min(clock.instant().plus(Duration.ofHours(24)),p.getScheduleDueAt()));
            }
            case "REJECT", "CANCEL" -> {note(c.note());
                if("REJECT".equals(c.action())&&actor.equals(p.getScheduleProposerId()))throw conflict();
                close(o,p,c.action());
            }
            case "VIEWED" -> {
                if(!"CONFIRMED".equals(p.getStatus())||!"READY".equals(p.getRoomStatus())||clock.instant().isBefore(p.getScheduledAt()))throw conflict();
                note(c.note());close(o,p,"VIEWED");
            }
            case "NO_SHOW" -> {
                if(!"CONFIRMED".equals(p.getStatus())||clock.instant().isBefore(p.getScheduledAt().plusSeconds(900))
                        ||!events.existsByPreviewIdAndType(id,"CONTACT"))throw conflict();
                note(c.note());p.setStatus("SUPPORT_REQUIRED");p.setLastError("NO_SHOW_REQUIRES_REVIEW");
            }
            case "MEET_ERROR" -> {note(c.note());p.setStatus("SUPPORT_REQUIRED");p.setLastError("MEET_ERROR_NO_USER_FAULT");}
            default -> throw new AppException(ErrorCode.PREVIEW_INVALID);
        }
        event(p,actor,c.action(),c.note());return p;
    }
    private Instant min(Instant a,Instant b){return a.isBefore(b)?a:b;}
    private void close(Order o,PreviewSession p,String status){
        p.setStatus(status);p.setActiveSlot(null);p.setClosedAt(clock.instant());
        if(p.isPauseActive()&&o.getOrderStatus()!=OrderStatus.COMPLETED&&o.getOrderStatus()!=OrderStatus.CANCELLED){
            deadlines.resume(o.getOrderId(),"PREVIEW",p.getId(),p.getId(),false);p.setPauseActive(false);
        }
    }
    private boolean expire(PreviewSession p){
        boolean overdue="REQUESTED".equals(p.getStatus())&&(!clock.instant().isBefore(p.getResponseDueAt())||!clock.instant().isBefore(p.getScheduleDueAt()));
        boolean unattended="CONFIRMED".equals(p.getStatus())&&!clock.instant().isBefore(p.getScheduledAt().plus(Duration.ofHours(24)));
        if(!overdue&&!unattended)return false;
        p.setStatus("SUPPORT_REQUIRED");p.setLastError("COORDINATION_DEADLINE_ADMIN_REQUIRED");return true;
    }
    @Transactional public void expire(UUID orderId,UUID id){
        var o=locked(orderId,true);var p=session(orderId,id);if(p.getActiveSlot()==null)return;
        if(o.getOrderStatus()==OrderStatus.COMPLETED||o.getOrderStatus()==OrderStatus.CANCELLED){close(o,p,"ORDER_ENDED");event(p,null,"ORDER_ENDED",null);}
        else if(expire(p))event(p,null,"ESCALATED",p.getLastError());
    }
    @Transactional public Detail support(UUID orderId,UUID id,Command c){
        if(!token.hasRole("ROLE_ADMIN"))throw new AppException(ErrorCode.FORBIDDEN);
        var o=locked(orderId,true);var p=session(orderId,id);
        if(c!=null){version(p,c.expectedVersion());note(c.note());if(p.getActiveSlot()==null||!"CLOSE".equals(c.action()))throw conflict();
            close(o,p,"SUPPORT_CLOSED");event(p,token.getCurrentUserId(),"SUPPORT_CLOSED",c.note());}
        return new Detail(p,events.findByPreviewIdOrderByOccurredAtAsc(id));
    }
}
