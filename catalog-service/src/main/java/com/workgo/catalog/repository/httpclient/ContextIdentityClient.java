package com.workgo.catalog.repository.httpclient;
import com.workgo.catalog.configuration.ContextFeignConfig;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@FeignClient(name="catalogContextIdentity",url="${app.service.identity.url}",configuration=ContextFeignConfig.class)
public interface ContextIdentityClient {
    @GetMapping("/internal/providers/{id}") JsonNode provider(@PathVariable UUID id);
    @GetMapping("/internal/users/{id}/active") boolean active(@PathVariable UUID id);
    @GetMapping("/internal/providers/{id}/admission") JsonNode admission(@PathVariable UUID id);
}
