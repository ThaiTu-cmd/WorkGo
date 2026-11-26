package com.workgo.order.service;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** Server-to-server admission hook. Trust owns the DEV-21 quote producer. */
@Service
@RequiredArgsConstructor
public class OrderRewardQuoteService {
    private final QuoteClient client;
    private final Clock clock;
    @Value("${order.reward-quote.required:true}")
    private boolean required;

    public record Input(UUID clientId, UUID providerId, String sourceType, UUID sourceId,
                        String scope, BigDecimal price, String currency, Integer durationDays, UUID feePolicyVersionId) {
        public Input { if (price != null) price = price.stripTrailingZeros(); }
    }
    public record Quote(String reference, Input input, String policyVersion, Instant expiresAt,String inputHash,Integer points,
                        Long remainingPairCap,Long remainingProviderCap,boolean needsReview,String modelVersion) {
        public Quote(String reference,Input input,String policyVersion,Instant expiresAt){this(reference,input,policyVersion,expiresAt,null,null,null,null,false,null);}
    }
    public Quote historic(String reference){
        try{var response=client.get(UUID.fromString(reference));var q=response==null?null:response.getResult();
            if(response==null||response.getCode()!=1000||q==null||!reference.equals(q.reference())||q.input()==null)throw new IllegalStateException();return q;
        }catch(RuntimeException e){throw new AppException(ErrorCode.ORDER_REWARD_QUOTE_UNAVAILABLE);}
    }
    public Quote preview(Input input){
        try{return checked(input,client.quote(input));}
        catch(RuntimeException e){throw new AppException(ErrorCode.ORDER_REWARD_QUOTE_UNAVAILABLE);}
    }
    /** Reward rubric uses calendar days; onsite packages specify a duration in minutes. */
    static Integer durationDays(com.workgo.order.enumeration.ExecutionType type,Integer deliveryDays,Integer minutes){
        if(type!=com.workgo.order.enumeration.ExecutionType.ONSITE)return deliveryDays;
        return minutes==null||minutes<1?null:(int)((minutes+1439L)/1440L);
    }
    public String reference(Input input,String reference){return referenceAt(input,reference,clock.instant());}
    public String referenceAt(Input input,String reference,Instant consentAt){
        try{var q=historic(reference);if(!input.equals(q.input())||!"WG-POLICY-1.0".equals(q.policyVersion())||consentAt==null||q.expiresAt()==null||!q.expiresAt().isAfter(consentAt))throw new IllegalStateException();return reference;}
        catch(RuntimeException e){throw new AppException(ErrorCode.ORDER_REWARD_QUOTE_UNAVAILABLE);}
    }
    private Quote checked(Input input,ApiResponse<Quote> response){
        var q=response==null?null:response.getResult();
        if(response==null||response.getCode()!=1000||q==null||q.reference()==null||!input.equals(q.input())||!"WG-POLICY-1.0".equals(q.policyVersion())||q.expiresAt()==null||!q.expiresAt().isAfter(clock.instant()))throw new AppException(ErrorCode.ORDER_REWARD_QUOTE_UNAVAILABLE);
        return q;
    }

    public String quote(Input input) {
        if (!required) return null;
        try {
            ApiResponse<Quote> response = client.quote(input);
            Quote quote = response == null ? null : response.getResult();
            if (response == null || response.getCode()!=1000 || quote == null || quote.reference()==null
                    || quote.reference().isBlank() || !Objects.equals(quote.input(), input)
                    || !"WG-POLICY-1.0".equals(quote.policyVersion()) || quote.expiresAt()==null
                    || !quote.expiresAt().isAfter(clock.instant())) {
                throw new IllegalStateException("Invalid reward quote acknowledgment");
            }
            return quote.reference();
        } catch (RuntimeException exception) {
            throw new AppException(ErrorCode.ORDER_REWARD_QUOTE_UNAVAILABLE);
        }
    }

    @FeignClient(name="orderRewardQuoteClient", url="${app.services.trust}",
            configuration=com.workgo.order.reppository.client.InternalFeignConfiguration.class)
    public interface QuoteClient {
        @org.springframework.web.bind.annotation.GetMapping("/internal/rewards/quotes/{id}") ApiResponse<Quote> get(@org.springframework.web.bind.annotation.PathVariable UUID id);
        @PostMapping("/internal/rewards/quotes")
        ApiResponse<Quote> quote(@RequestBody Input input);
    }
}
