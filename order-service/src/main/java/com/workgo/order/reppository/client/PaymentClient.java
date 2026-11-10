package com.workgo.order.reppository.client;

import com.workgo.order.configuration.FeignInternalConfig;
import com.workgo.order.dto.request.EscrowRefundRequest;
import com.workgo.order.dto.request.EscrowReleaseRequest;
import com.workgo.order.dto.response.client.EscrowResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service", url = "${app.services.payment}", configuration = FeignInternalConfig.class)
public interface PaymentClient {

    @PostMapping("/internal/escrows/release")
    EscrowResponse release(@RequestBody EscrowReleaseRequest request);

    @PostMapping("/internal/escrows/refund")
    EscrowResponse refund(@RequestBody EscrowRefundRequest request);

}
