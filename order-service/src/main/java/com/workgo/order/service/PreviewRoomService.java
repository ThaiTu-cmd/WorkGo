package com.workgo.order.service;

import com.workgo.order.entity.PreviewSession;
import com.workgo.order.exception.*;
import com.workgo.order.reppository.PreviewSessionRepository;
import com.workgo.order.service.meet.MeetClient;
import com.workgo.order.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;

/** The committed attempt fences provider IO. An uncertain POST is never blindly repeated. */
@Service @RequiredArgsConstructor
public class PreviewRoomService {
    private final PreviewService lifecycle;
    private final PreviewSessionRepository sessions;
    private final MeetClient meet;
    private final TokenUtils token;
    private final TransactionTemplate tx;
    private record Attempt(UUID id,UUID host,UUID attemptId,boolean ready) {}
    public PreviewSession provision(UUID orderId,UUID id,long expectedVersion){
        Attempt a=tx.execute(s->{
            var o=lifecycle.locked(orderId,false);lifecycle.active(o);var p=lifecycle.session(orderId,id);
            host(p);if("READY".equals(p.getRoomStatus()))return new Attempt(id,p.getHostUserId(),p.getAttemptId(),true);
            if(p.getVersion()!=expectedVersion||p.getActiveSlot()==null||!"CONFIRMED".equals(p.getStatus())||!"NOT_CREATED".equals(p.getRoomStatus()))conflict();
            meet.assertAuthorized(p.getHostUserId());
            p.setAttemptId(UUID.randomUUID());p.setRoomStatus("CREATING");p.setLastError(null);
            lifecycle.event(p,token.getCurrentUserId(),"ROOM_ATTEMPT",p.getAttemptId().toString());
            return new Attempt(id,p.getHostUserId(),p.getAttemptId(),false);
        });
        if(a.ready())return read(orderId,id);
        try {
            var space=meet.createSpace(id,a.host());
            return finish(orderId,a,space);
        }catch(RuntimeException e){
            tx.executeWithoutResult(s->{lifecycle.locked(orderId,false);var p=lifecycle.session(orderId,id);
                if(a.attemptId().equals(p.getAttemptId())&&!"READY".equals(p.getRoomStatus())){
                    boolean safe=e instanceof MeetClient.NotCreatedException;
                    p.setRoomStatus(safe?"NOT_CREATED":"NEEDS_RECONCILIATION");p.setLastError(safe?"AUTHORIZATION_OR_REQUEST_REJECTED":"CREATE_RESULT_UNKNOWN");
                    lifecycle.event(p,a.host(),safe?"ROOM_NOT_CREATED":"ROOM_RESULT_UNKNOWN",a.attemptId().toString());}
            });
            throw new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE);
        }
    }
    public PreviewSession reconcile(UUID orderId,UUID id,long version,String externalName){
        Attempt a=tx.execute(s->{var o=lifecycle.locked(orderId,false);lifecycle.active(o);var p=lifecycle.session(orderId,id);host(p);
            if(p.getVersion()!=version||p.getActiveSlot()==null||p.getAttemptId()==null
                    ||!("CREATING".equals(p.getRoomStatus())||"NEEDS_RECONCILIATION".equals(p.getRoomStatus())))conflict();
            return new Attempt(id,p.getHostUserId(),p.getAttemptId(),false);
        });
        MeetClient.Space verified;
        try{verified=meet.lookupSpace(a.host(),externalName);}catch(RuntimeException e){throw new AppException(ErrorCode.PREVIEW_MEET_UNAVAILABLE);}
        return finish(orderId,a,verified);
    }
    private PreviewSession finish(UUID orderId,Attempt a,MeetClient.Space space){
        return tx.execute(s->{lifecycle.locked(orderId,false);var p=lifecycle.session(orderId,a.id());
            if(!a.attemptId().equals(p.getAttemptId()))conflict();
            if("READY".equals(p.getRoomStatus())){
                if(!Objects.equals(p.getSpaceName(),space.name()))conflict();return p;
            }
            p.setSpaceName(space.name());p.setMeetingUri(space.meetingUri());p.setRoomStatus("READY");p.setLastError(null);
            lifecycle.event(p,a.host(),"ROOM_READY",space.name());return p;
        });
    }
    private PreviewSession read(UUID orderId,UUID id){return tx.execute(s->{lifecycle.locked(orderId,false);return lifecycle.session(orderId,id);});}
    private void host(PreviewSession p){if(!token.getCurrentUserId().equals(p.getHostUserId()))throw new AppException(ErrorCode.FORBIDDEN);}
    private void conflict(){throw new AppException(ErrorCode.PREVIEW_CONFLICT);}
}
