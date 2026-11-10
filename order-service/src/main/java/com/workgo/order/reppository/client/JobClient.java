package com.workgo.order.reppository.client;

import com.workgo.order.dto.response.client.AcceptedProposalResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.UUID;

@FeignClient(name = "job-service", contextId = "orderJobClient", url = "${app.services.job}",
        configuration = InternalFeignConfiguration.class)
public interface JobClient {
    @GetMapping("/internal/proposals/{proposalId}")
    AcceptedProposalResponse getProposal(@PathVariable("proposalId") UUID proposalId);
}
