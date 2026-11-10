package com.workgo.job.repository.client;

import com.workgo.job.dto.request.CreateProposalOrderRequest;
import com.workgo.job.dto.response.client.ProposalOrderResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "order-service", contextId = "jobOrderClient", url = "${app.services.order}",
        configuration = {JobFeignConfiguration.class, InternalKeyFeignConfiguration.class})
public interface OrderClient {
    @PostMapping("/internal/orders/from-proposal")
    ProposalOrderResponse createFromProposal(@RequestHeader("Idempotency-Key") UUID proposalId,
                                            @RequestBody CreateProposalOrderRequest request);
}
