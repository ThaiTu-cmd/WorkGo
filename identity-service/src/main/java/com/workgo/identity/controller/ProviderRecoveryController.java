package com.workgo.identity.controller;
import com.workgo.identity.service.ProviderRecoveryService;import com.workgo.identity.repository.ProviderRecoveryGrantRepository;
import com.workgo.identity.entity.ProviderRecoveryGrant;import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import java.util.UUID;
@RestController @RequiredArgsConstructor
public class ProviderRecoveryController {
    private final ProviderRecoveryService service;private final ProviderRecoveryGrantRepository grants;
    public record Reason(String reason){}
    @PostMapping("/providers/{id}/recovery-grants")public ProviderRecoveryGrant approve(@PathVariable UUID id,@RequestBody Reason req){return service.approve(id,req.reason());}
    @PostMapping("/providers/{id}/recovery-completion")public com.fasterxml.jackson.databind.JsonNode complete(@PathVariable UUID id,@RequestBody Reason req){return service.complete(id,req.reason());}
    @GetMapping("/internal/recovery-grants/{id}")public ProviderRecoveryGrant get(@PathVariable UUID id){return grants.findById(id).orElseThrow();}
}
