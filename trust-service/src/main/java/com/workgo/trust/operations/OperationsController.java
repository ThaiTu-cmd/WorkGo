package com.workgo.trust.operations;
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
        values.put("outbox_pending", jdbc.queryForObject("select count(*) from outbox_events where status in ('PENDING','PROCESSING')", Double.class));
        values.put("outbox_failed", jdbc.queryForObject("select count(*) from outbox_events where status='FAILED'", Double.class));
        values.put("outbox_oldest_seconds", jdbc.queryForObject("select coalesce(extract(epoch from now()-min(created_at)),0) from outbox_events where status in ('PENDING','PROCESSING')", Double.class));
        values.put("decision_reconciliation", jdbc.queryForObject("select count(*) from dispute_decisions where execution_status='NEEDS_RECONCILIATION'", Double.class));
        values.put("review_overdue", jdbc.queryForObject("select count(*) from reward_reviews where status='PENDING' and due_at<now()", Double.class));
        values.put("restriction_destination_lag", jdbc.queryForObject("select count(*) from reputation_projections where identity_synced_version<source_version or job_synced_version<source_version or catalog_synced_version<source_version or order_synced_version<source_version", Double.class));
  return values;
 }
 @GetMapping("/ready") public Map<String,Double> ready(){try{return snapshot();}catch(RuntimeException unavailable){throw new org.springframework.web.server.ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Operational source unavailable");}}
 @GetMapping(value="/metrics",produces="text/plain;version=0.0.4") public String metrics(){var out=new StringBuilder();ready().forEach((name,value)->out.append("workgo_").append(name).append("{service=\"trust\"} ").append(value).append('\n'));return out.toString();}
 @Scheduled(fixedDelayString="${operations.alert.poll-millis:60000}",initialDelayString="${operations.alert.poll-millis:60000}") public void alert(){
  try{snapshot().forEach((name,value)->{if((name.endsWith("_seconds")&&value>maxPendingAge)||(Set.of("outbox_failed","ledger_imbalanced_transactions","payout_unknown","callback_unknown","decision_reconciliation","review_overdue","restriction_destination_lag","timer_ack_missing").contains(name)&&value>0))log.warn("WORKGO_ALERT service=trust metric={} value={} ageThresholdSeconds={}",name,value,maxPendingAge);});}
  catch(RuntimeException down){log.warn("WORKGO_ALERT service=trust metric=db_unavailable value=1");}
 }
}
