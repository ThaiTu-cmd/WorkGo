package com.workgo.order.controller;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.service.DeadlinePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor @RequestMapping("/orders/{orderId}/timer")
public class OrderTimerController {
    private final DeadlinePolicyService service;
    @GetMapping public ApiResponse<DeadlinePolicyService.TimerAck> status(@PathVariable UUID orderId){
        return ApiResponse.<DeadlinePolicyService.TimerAck>builder().code(1000).result(service.status(orderId)).build();}
    @PostMapping("/extension") public ApiResponse<DeadlinePolicyService.TimerAck> extend(@PathVariable UUID orderId,
            @RequestBody DeadlinePolicyService.ExtensionCommand command){
        return ApiResponse.<DeadlinePolicyService.TimerAck>builder().code(1000).result(service.extend(orderId,command.expectedVersion())).build();}
}
