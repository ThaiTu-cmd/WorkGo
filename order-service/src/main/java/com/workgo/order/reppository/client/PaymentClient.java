package com.workgo.order.reppository.client;

import com.workgo.order.configuration.FeignInternalConfig;
import com.workgo.order.dto.request.CashFeeRequest;
import com.workgo.order.dto.request.EscrowAdjustRequest;
import com.workgo.order.dto.request.EscrowRefundRequest;
import com.workgo.order.dto.request.EscrowReleaseRequest;
import com.workgo.order.dto.response.client.CashFeeResponse;
import com.workgo.order.dto.response.client.EscrowResponse;
import com.workgo.order.dto.response.client.FeePolicyResponse;
import com.workgo.order.dto.response.client.FinancialEligibilityResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "payment-service", url = "${app.services.payment}", configuration = FeignInternalConfig.class)
public interface PaymentClient {

    @PostMapping("/internal/escrows/release")
    EscrowResponse release(@RequestBody EscrowReleaseRequest request);

    @PostMapping("/internal/escrows/refund")
    EscrowResponse refund(@RequestBody EscrowRefundRequest request);

    @PostMapping("/internal/escrows/adjust")
    EscrowResponse adjust(@RequestBody EscrowAdjustRequest request);

    @GetMapping("/internal/fee-policies/current")
    FeePolicyResponse getCurrentFeePolicy();

    @PostMapping("/internal/cash-fees")
    CashFeeResponse recordCashFee(@RequestBody CashFeeRequest request);

    @GetMapping("/internal/providers/{providerId}/financial-eligibility")
    FinancialEligibilityResponse getFinancialEligibility(@PathVariable("providerId") UUID providerId);

}
