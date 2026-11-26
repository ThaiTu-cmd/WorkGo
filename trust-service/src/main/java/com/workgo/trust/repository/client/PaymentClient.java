package com.workgo.trust.repository.client;

import com.workgo.trust.dto.request.client.EscrowFreezeRequest;
import com.workgo.trust.dto.response.client.EscrowAccountResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name="trustPaymentClient", url="${app.services.payment}", configuration=TrustClientsConfiguration.class)
public interface PaymentClient {
    record CashReceipt(java.util.UUID decisionId,java.util.UUID orderId,java.util.UUID disputeId,java.util.UUID feeAssessmentId,java.util.UUID feePolicyVersionId,long orderAmount,long feeAmount,long cashReturnDue,String currency,String status){}
    @PostMapping("/internal/cash-decisions/cancel") CashReceipt cancelCash(@RequestBody com.workgo.trust.dto.request.client.CashDecisionCommand command);
    record Eligibility(java.util.UUID userId,long balance,long outstandingFee,boolean mayStartNewWork){}
    @GetMapping("/internal/providers/{id}/financial-eligibility") Eligibility eligibility(@PathVariable java.util.UUID id);
    @PostMapping("/internal/escrows/settle")
    com.workgo.trust.dto.response.client.SettlementResult settle(@RequestBody com.workgo.trust.dto.request.client.SettlementCommand command);
    @PostMapping("/internal/escrows/freeze") EscrowAccountResponse freeze(@RequestBody EscrowFreezeRequest request);
    @PostMapping("/internal/escrows/unfreeze") EscrowAccountResponse unfreeze(@RequestBody EscrowFreezeRequest request);
}
