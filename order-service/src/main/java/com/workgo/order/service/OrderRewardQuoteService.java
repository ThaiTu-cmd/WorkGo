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
    @Value("${order.reward-quote.required:false}")
    private boolean required;

    public record Input(UUID clientId, UUID providerId, String sourceType, UUID sourceId,
                        String scope, BigDecimal price, String currency, Integer durationDays, UUID feePolicyVersionId) {
        public Input { if (price != null) price = price.stripTrailingZeros(); }
    }
    public record Quote(String reference, Input input, String policyVersion, Instant expiresAt) {}

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
        @PostMapping("/internal/rewards/quotes")
        ApiResponse<Quote> quote(@RequestBody Input input);
    }
}
