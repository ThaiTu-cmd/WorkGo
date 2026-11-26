package com.workgo.communication.operations;
import org.springframework.data.mongodb.core.MongoTemplate;import org.springframework.data.mongodb.core.query.*;
import org.springframework.web.bind.annotation.*;import org.springframework.http.*;import org.springframework.scheduling.annotation.Scheduled;
import lombok.RequiredArgsConstructor;import lombok.extern.slf4j.Slf4j;import java.util.*;import java.time.Instant;
@RestController @RequiredArgsConstructor @Slf4j @RequestMapping("/internal/operations")
public class OperationsController {
 private final MongoTemplate mongo;
 @GetMapping("/ready") public Map<String,Double> ready(){try{
  mongo.executeCommand("{ping:1}");var values=new TreeMap<String,Double>();values.put("db_up",1D);
  values.put("outbox_pending",(double)mongo.count(Query.query(Criteria.where("processedAt").is(null)),"outbox_events"));
  var pendingOutbox=Query.query(Criteria.where("processedAt").is(null));
  var oldestOutbox=mongo.findOne(pendingOutbox.with(org.springframework.data.domain.Sort.by("createdAt")),org.bson.Document.class,"outbox_events");
  values.put("outbox_oldest_seconds",oldestOutbox==null?0D:(double)Math.max(0,Instant.now().getEpochSecond()-oldestOutbox.getDate("createdAt").toInstant().getEpochSecond()));
  values.put("outbox_failed",(double)mongo.count(Query.query(Criteria.where("processedAt").is(null).and("errorMessage").ne(null)),"outbox_events"));
  values.put("attachment_uploads_pending",(double)mongo.count(Query.query(Criteria.where("status").is("UPLOADING")),"chat_attachments"));
  var oldest=mongo.findOne(Query.query(Criteria.where("status").is("UPLOADING")).with(org.springframework.data.domain.Sort.by("createdAt")),org.bson.Document.class,"chat_attachments");
  values.put("attachment_upload_oldest_seconds",oldest==null?0D:(double)Math.max(0,Instant.now().getEpochSecond()-oldest.getDate("createdAt").toInstant().getEpochSecond()));return values;
 }catch(RuntimeException failure){throw new org.springframework.web.server.ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Operational source unavailable");}}
 @GetMapping(value="/metrics",produces="text/plain;version=0.0.4")public String metrics(){var out=new StringBuilder();ready().forEach((k,v)->out.append("workgo_").append(k).append("{service=\"communication\"} ").append(v).append('\n'));return out.toString();}
 @Scheduled(fixedDelay=60000,initialDelay=60000) public void alert(){try{var values=ready();values.forEach((name,value)->{if((name.endsWith("_seconds")&&value>600)||(name.equals("outbox_failed")&&value>0))log.warn("WORKGO_ALERT service=communication metric={} value={} threshold=600",name,value);});}catch(RuntimeException failure){log.warn("WORKGO_ALERT service=communication metric=db_unavailable value=1");}}
}
