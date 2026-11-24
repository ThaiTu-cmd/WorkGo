package com.workgo.trust.repository.client;

import com.workgo.trust.dto.request.client.EscrowFreezeRequest;
import com.workgo.trust.dto.response.client.EscrowAccountResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name="trustPaymentClient", url="${app.services.payment}", configuration=TrustClientsConfiguration.class)
public interface PaymentClient {
    @PostMapping("/internal/escrows/settle")
    com.workgo.trust.dto.response.client.SettlementResult settle(@RequestBody com.workgo.trust.dto.request.client.SettlementCommand command);
    @PostMapping("/internal/escrows/freeze") EscrowAccountResponse freeze(@RequestBody EscrowFreezeRequest request);
    @PostMapping("/internal/escrows/unfreeze") EscrowAccountResponse unfreeze(@RequestBody EscrowFreezeRequest request);
}
