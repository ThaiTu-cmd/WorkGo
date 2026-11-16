package com.workgo.trust.controller;
import com.workgo.trust.dto.request.*;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.service.DisputeService;
import com.workgo.trust.utils.TokenUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/disputes") @RequiredArgsConstructor
public class DisputeController {
    private final DisputeService service;
    private final TokenUtils tokens;
    @PostMapping
    public ApiResponse<DisputeDto> create(@Valid @RequestBody DisputeCreateReq req) {
        return ApiResponse.<DisputeDto>builder().result(service.create(req,tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull())).build();
    }
    @PostMapping("/{id}/cancel")
    public ApiResponse<DisputeDto> cancel(@PathVariable UUID id,@Valid @RequestBody(required=false) DisputeCancelReq req) {
        return ApiResponse.<DisputeDto>builder().result(service.cancel(id,req,tokens.getCurrentUserId())).build();
    }
    @GetMapping("/{id}")
    public ApiResponse<DisputeDto> get(@PathVariable UUID id) {
        return ApiResponse.<DisputeDto>builder().result(service.get(id,tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull())).build();
    }
    @GetMapping("/orders/{id}")
    public ApiResponse<List<DisputeDto>> order(@PathVariable UUID id) {
        return ApiResponse.<List<DisputeDto>>builder().result(service.orderDisputes(id,tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull())).build();
    }
    @GetMapping("/my-disputes")
    public ApiResponse<PageResponse<DisputeDto>> mine(@RequestParam(required=false) DisputeStatus status,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<PageResponse<DisputeDto>>builder().result(service.myDisputes(tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull(),status,page,size)).build();
    }
}
