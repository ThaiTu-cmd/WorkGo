package com.workgo.trust.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.trust.entity.RewardQuote;
import com.workgo.trust.repository.*;
import com.workgo.trust.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
@Service @RequiredArgsConstructor
public class RewardQuoteService {
    private final RewardQuoteRepository quotes;
    private final ReputationLedgerRepository ledger;
    private final ObjectMapper json;
    public record Input(UUID clientId,UUID providerId,String sourceType,UUID sourceId,String scope,
                        BigDecimal price,String currency,Integer durationDays,UUID feePolicyVersionId) {
        public Input { if(price!=null)price=price.stripTrailingZeros(); }
    }
    public record Quote(String reference,Input input,String policyVersion,Instant expiresAt,String inputHash,int points,
                        long remainingPairCap,long remainingProviderCap,boolean needsReview,String modelVersion) {}
    @Transactional
    public Quote quote(Input input) {
        if(input==null || input.clientId()==null || input.providerId()==null || input.sourceId()==null
                ||!Set.of("SERVICE","PROPOSAL","JOB","AMENDMENT").contains(input.sourceType()) ||input.scope()==null||input.scope().isBlank()
                ||input.scope().length()>20000 ||input.price()==null||input.price().signum()<=0||input.price().scale()>0
                ||!"VND".equals(input.currency()) ||input.durationDays()==null||input.durationDays()<1||input.durationDays()>36500)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        try {
            String payload=json.writeValueAsString(input);
            // With no model adapter, conservative base 2 is explicit. Client prose cannot grant points or privileges.
            var row=quotes.saveAndFlush(new RewardQuote(input.providerId(),input.clientId(),ReputationService.hash(payload),payload,2,false));
            var now=Instant.now();
            return new Quote(row.getId().toString(),input,row.getRuleVersion(),row.getExpiresAt(),row.getInputHash(),row.getPoints(),
                    Math.max(0,5-ledger.rewards(input.providerId(),input.clientId(),now.minusSeconds(30L*86400))),
                    Math.max(0,10-ledger.rewards(input.providerId(),null,now.minusSeconds(7L*86400))),row.isNeedsReview(),row.getModelVersion());
        }catch(AppException e){throw e;}catch(Exception e){throw new AppException(ErrorCode.INVALID_REQUEST);}
    }
    @Transactional(readOnly=true)
    public Quote get(UUID id){
        var row=quotes.findById(id).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));
        try{var input=json.readValue(row.getInputPayload(),Input.class);var now=Instant.now();
            return new Quote(row.getId().toString(),input,row.getRuleVersion(),row.getExpiresAt(),row.getInputHash(),row.getPoints(),
                    Math.max(0,5-ledger.rewards(input.providerId(),input.clientId(),now.minusSeconds(30L*86400))),
                    Math.max(0,10-ledger.rewards(input.providerId(),null,now.minusSeconds(7L*86400))),row.isNeedsReview(),row.getModelVersion());
        }catch(AppException e){throw e;}catch(Exception e){throw new AppException(ErrorCode.INVALID_REQUEST);}
    }
}
