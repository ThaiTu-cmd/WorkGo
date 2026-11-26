package com.workgo.trust.service;
import com.workgo.trust.entity.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.repository.client.OrderClient;
import com.workgo.trust.exception.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
@Service @RequiredArgsConstructor
public class RewardCompletionService {
    private final OrderClient orders;
    private final RewardQuoteRepository quotes;
    private final RewardCommitReceiptRepository commits;
    private final RewardSnapshotRepository snapshots;
    private final TrustTransactions transactions;
    private final ReputationService reputation;
    private final ObjectMapper json;
    private final RewardReviewService reviews;
    public record Commit(UUID orderId,UUID providerId,UUID clientId,String quoteRef,java.time.Instant confirmedAt){}
    public record CommitAck(UUID orderId,String quoteRef){}
    public CommitAck commit(Commit c) {
        if(c==null||c.orderId()==null||c.confirmedAt()==null||c.confirmedAt().isAfter(java.time.Instant.now().plusSeconds(60)))throw new AppException(ErrorCode.INVALID_REQUEST);
        RewardQuote q;
        try{q=quotes.findById(UUID.fromString(c.quoteRef())).orElseThrow();}catch(Exception e){throw new AppException(ErrorCode.INVALID_REQUEST);}
        if(!q.getProviderId().equals(c.providerId())||!q.getClientId().equals(c.clientId())||c.confirmedAt().isBefore(q.getCreatedAt())||c.confirmedAt().isAfter(q.getExpiresAt()))throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        transactions.locked(List.of("reward:"+c.orderId()),()->{
            String key=c.orderId()+":"+q.getId();var old=commits.findById(key).orElse(null);
            if(old!=null){if(!old.getInputHash().equals(q.getInputHash())||!old.getConfirmedAt().equals(c.confirmedAt().truncatedTo(java.time.temporal.ChronoUnit.MICROS)))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);return old;}
            return commits.saveAndFlush(new RewardCommitReceipt(c.orderId(),q,c.confirmedAt()));
        });
        return new CommitAck(c.orderId(),c.quoteRef());
    }
    record Prepared(UUID orderId,RewardQuote quote,java.time.Instant confirmedAt){}
    public void complete(UUID id,UUID provider,UUID client) {
        var prepared=prepare(id,provider,client);
        if(prepared!=null)apply(prepared);
    }
    Prepared prepare(UUID id,UUID provider,UUID client) {
        var a=orders.rewardAgreement(id);
        if(a==null ||!id.equals(a.orderId())||!provider.equals(a.providerId())||!client.equals(a.clientId())) throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        if(a.recoveryGrantId()!=null)return null; // Supervised recovery uses its separately approved ledger entry after two clients.
        // Legacy orders without a reviewed quote do not receive invented retrospective rewards.
        if(a.quoteRef()==null)return null;
        RewardQuote q;
        try{q=quotes.findById(UUID.fromString(a.quoteRef())).orElseThrow();
            var receipt=commits.findById(id+":"+q.getId()).orElseThrow();
            if(!receipt.getInputHash().equals(q.getInputHash())||!receipt.getProviderId().equals(provider)||!receipt.getClientId().equals(client)
                    ||a.confirmedAt()==null||!receipt.getConfirmedAt().equals(a.confirmedAt().truncatedTo(java.time.temporal.ChronoUnit.MICROS)))throw new IllegalArgumentException();
            var input=json.readValue(q.getInputPayload(),RewardQuoteService.Input.class);
            if(!q.getProviderId().equals(a.providerId())||!q.getClientId().equals(a.clientId())
                    ||!Objects.equals(input.scope(),a.scope())||a.price()==null||input.price().compareTo(a.price())!=0
                    ||!Objects.equals(input.durationDays(),a.durationDays())||a.confirmedAt()==null
                    ||a.confirmedAt().isBefore(q.getCreatedAt())||a.confirmedAt().isAfter(q.getExpiresAt())
                    ||!"COMPLETED".equals(a.orderStatus())||!Set.of("RELEASED","CASH_SETTLED").contains(a.paymentStatus()))
                throw new IllegalArgumentException();
        }catch(Exception e){throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);}
        return new Prepared(id,q,a.confirmedAt());
    }
    void apply(Prepared prepared) {
        UUID id=prepared.orderId();var quote=prepared.quote();
        var snapshot=transactions.locked(List.of("reward:"+id),()->{
            var old=snapshots.findById(id).orElse(null);
            if(old!=null){if(!old.getInputHash().equals(quote.getInputHash()))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);return old;}
            return snapshots.saveAndFlush(new RewardSnapshot(id,quote,prepared.confirmedAt()));
        });
        if(!snapshot.isNeedsReview())reputation.reward(snapshot);else reviews.request(id);
    }
}
