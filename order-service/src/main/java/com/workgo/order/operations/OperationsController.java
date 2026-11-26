package com.workgo.order.operations;
import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;import lombok.extern.slf4j.Slf4j;import java.util.*;
/** Aggregate operational signals. Existing internal-key filters protect these endpoints. */
@Service @RestController @RequiredArgsConstructor @Slf4j @RequestMapping("/internal/operations")
public class OperationsController {
 private final JdbcTemplate jdbc;
 @Value("${operations.alert.max-pending-age-seconds:300}") private double maxPendingAge;
 public Map<String,Double> snapshot(){
  var values=new TreeMap<String,Double>();values.put("db_up",jdbc.queryForObject("select 1",Double.class));
        values.put("outbox_pending", jdbc.queryForObject("select count(*) from order_completed_outbox where status in ('PENDING','PROCESSING')", Double.class));
        values.put("outbox_failed", jdbc.queryForObject("select count(*) from order_completed_outbox where status='FAILED'", Double.class));
        values.put("outbox_oldest_seconds", jdbc.queryForObject("select coalesce(extract(epoch from now()-min(completed_at)),0) from order_completed_outbox where status in ('PENDING','PROCESSING')", Double.class));
        values.put("reward_snapshot_pending", jdbc.queryForObject("select count(*) from reward_commit_outbox where not acknowledged", Double.class));
        values.put("timer_overdue_seconds", jdbc.queryForObject("select coalesce(extract(epoch from now()-min(due_at)),0) from order_timer_states where due_at<now() and accepted_at is null and paused_at is null", Double.class));
        values.put("timer_ack_missing", jdbc.queryForObject("select count(*) from order_timer_states where due_at<now() and notification_ack_at is null and accepted_at is null and paused_at is null", Double.class));
  return values;
 }
 @GetMapping("/ready") public Map<String,Double> ready(){try{return snapshot();}catch(RuntimeException unavailable){throw new org.springframework.web.server.ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Operational source unavailable");}}
 @GetMapping(value="/metrics",produces="text/plain;version=0.0.4") public String metrics(){var out=new StringBuilder();ready().forEach((name,value)->out.append("workgo_").append(name).append("{service=\"order\"} ").append(value).append('\n'));return out.toString();}
 @Scheduled(fixedDelayString="${operations.alert.poll-millis:60000}",initialDelayString="${operations.alert.poll-millis:60000}") public void alert(){
  try{snapshot().forEach((name,value)->{if((name.endsWith("_seconds")&&value>maxPendingAge)||(Set.of("outbox_failed","ledger_imbalanced_transactions","payout_unknown","callback_unknown","decision_reconciliation","review_overdue","restriction_destination_lag","timer_ack_missing").contains(name)&&value>0))log.warn("WORKGO_ALERT service=order metric={} value={} ageThresholdSeconds={}",name,value,maxPendingAge);});}
  catch(RuntimeException down){log.warn("WORKGO_ALERT service=order metric=db_unavailable value=1");}
 }
}
