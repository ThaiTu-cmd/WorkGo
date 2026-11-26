package com.workgo.order.service;
import com.workgo.order.reppository.*;import com.workgo.order.reppository.client.TrustClient;
import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Component;import org.springframework.scheduling.annotation.Scheduled;
@Component @RequiredArgsConstructor
public class RewardCommitWorker {
 private final RewardCommitOutboxRepository rows;private final TrustClient trust;
 @Scheduled(fixedDelayString="${order.trust-outbox.poll-millis:5000}") public void deliver(){
  for(var row:rows.findTop50ByAcknowledgedFalseOrderByConfirmedAtAsc()){
   try{var ack=trust.commitReward(new TrustClient.RewardCommit(row.getOrderId(),row.getProviderId(),row.getClientId(),row.getQuoteRef(),row.getConfirmedAt()));
    if(ack==null||ack.getCode()!=1000||ack.getResult()==null||!row.getOrderId().equals(ack.getResult().orderId())||!row.getQuoteRef().equals(ack.getResult().quoteRef()))throw new IllegalStateException("Invalid ACK");
    row.setAcknowledged(true);row.setLastError(null);
   }catch(RuntimeException e){row.setLastError(e.getClass().getSimpleName());}rows.save(row);
  }
 }
}
