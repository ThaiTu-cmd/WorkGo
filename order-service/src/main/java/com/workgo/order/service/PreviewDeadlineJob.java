package com.workgo.order.service;
import com.workgo.order.reppository.PreviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Clock;
@Component @RequiredArgsConstructor @Slf4j
public class PreviewDeadlineJob {
    private final PreviewSessionRepository sessions;
    private final PreviewService previews;
    private final Clock clock;
    @Scheduled(fixedDelayString="${order.meet.poll-millis:60000}") public void sweep(){
        for(var p:sessions.findDue(clock.instant(),clock.instant().minusSeconds(86400),PageRequest.of(0,100))){
            try{previews.expire(p.getOrderId(),p.getId());}
            catch(RuntimeException e){log.warn("Preview deadline retry needed for {}",p.getId());}
        }
    }
}
