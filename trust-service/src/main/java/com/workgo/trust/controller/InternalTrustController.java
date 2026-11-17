package com.workgo.trust.controller;
import com.workgo.trust.dto.request.InternalOrderCompletedEventReq;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.service.InternalTrustService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalTrustController {
    private final InternalTrustService service;
    @PostMapping("/events/order-completed")
    public ApiResponse<Void> completed(@Valid @RequestBody InternalOrderCompletedEventReq req) {
        service.orderCompleted(req); return ApiResponse.<Void>builder().build();
    }
    @GetMapping("/orders/{id}/dispute-status")
    public InternalOrderDisputeStatusResponse status(@PathVariable UUID id) { return service.disputeStatus(id); }
}
