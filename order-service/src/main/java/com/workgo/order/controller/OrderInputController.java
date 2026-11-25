package com.workgo.order.controller;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.*;
import com.workgo.order.entity.OrderInputChecklist;
import com.workgo.order.service.OrderInputService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/orders/{orderId}/inputs") @RequiredArgsConstructor
public class OrderInputController {
    private final OrderInputService inputs;
    @GetMapping public ApiResponse<OrderInputChecklist> get(@PathVariable UUID orderId) { return ok(inputs.get(orderId)); }
    @PostMapping public ApiResponse<OrderInputChecklist> propose(@PathVariable UUID orderId,@Valid @RequestBody InputChecklistRequest body) { return ok(inputs.propose(orderId,body)); }
    @PostMapping("/confirm") public ApiResponse<OrderInputChecklist> confirm(@PathVariable UUID orderId,@Valid @RequestBody InputConfirmationRequest body) { return ok(inputs.confirmInputs(orderId,body.checklistVersion(),body.expectedVersion())); }
    @PostMapping("/submit") public ApiResponse<OrderInputChecklist> submit(@PathVariable UUID orderId,@Valid @RequestBody InputSubmissionRequest body) { return ok(inputs.submit(orderId,body)); }
    @PostMapping("/review") public ApiResponse<OrderInputChecklist> review(@PathVariable UUID orderId,@Valid @RequestBody InputReviewRequest body) { return ok(inputs.review(orderId,body)); }
    private <T> ApiResponse<T> ok(T result) { return ApiResponse.<T>builder().code(1000).result(result).build(); }
}
