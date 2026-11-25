package com.workgo.order.controller;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.entity.PreviewSession;
import com.workgo.order.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/orders/{orderId}/previews")
public class PreviewController {
    private final PreviewService previews;
    private final PreviewRoomService rooms;
    public record RoomCommand(long expectedVersion,String spaceName) {}
    @GetMapping public ApiResponse<List<PreviewSession>> list(@PathVariable UUID orderId){return ok(previews.list(orderId));}
    @GetMapping("/{id}") public ApiResponse<PreviewService.Detail> get(@PathVariable UUID orderId,@PathVariable UUID id){return ok(previews.get(orderId,id));}
    @PostMapping public ApiResponse<PreviewSession> request(@PathVariable UUID orderId,@RequestBody PreviewService.Request body){return ok(previews.request(orderId,body));}
    @PostMapping("/{id}/commands") public ApiResponse<PreviewSession> command(@PathVariable UUID orderId,@PathVariable UUID id,@RequestBody PreviewService.Command body){return ok(previews.command(orderId,id,body));}
    @PostMapping("/{id}/room") public ApiResponse<PreviewSession> room(@PathVariable UUID orderId,@PathVariable UUID id,@RequestBody RoomCommand body){return ok(rooms.provision(orderId,id,body.expectedVersion()));}
    @PostMapping("/{id}/room/reconcile") public ApiResponse<PreviewSession> reconcile(@PathVariable UUID orderId,@PathVariable UUID id,@RequestBody RoomCommand body){return ok(rooms.reconcile(orderId,id,body.expectedVersion(),body.spaceName()));}
    private <T> ApiResponse<T> ok(T result){return ApiResponse.<T>builder().code(1000).result(result).build();}
}
