package com.workgo.payment.reppository.client;
import com.workgo.payment.configuration.FeignInternalConfig;
import com.workgo.payment.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@FeignClient(name="job-service",contextId="paymentJobInternalClient",url="${app.services.job}",configuration=FeignInternalConfig.class)
public interface JobInternalClient {
    record Change(String source,long sourceVersion,boolean blocked) {}
    record Ack(UUID providerId,String source,long sourceVersion,boolean blocked) {}
    @PutMapping("/internal/providers/{id}/restrictions")
    ApiResponse<Ack> update(@PathVariable UUID id,@RequestBody Change request);
}
