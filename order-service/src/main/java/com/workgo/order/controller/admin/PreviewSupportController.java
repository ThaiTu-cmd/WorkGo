package com.workgo.order.controller.admin;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.entity.PreviewSession;
import com.workgo.order.reppository.PreviewSessionRepository;
import com.workgo.order.service.PreviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/admin/preview-support") @PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class PreviewSupportController {
    private final PreviewService previews;
    private final PreviewSessionRepository sessions;
    @GetMapping public ApiResponse<List<PreviewSession>> pending(@RequestParam(defaultValue="0") int page){return ok(sessions.findByStatus("SUPPORT_REQUIRED",PageRequest.of(Math.max(0,page),50)));}
    @GetMapping("/{orderId}/{id}") public ApiResponse<PreviewService.Detail> get(@PathVariable UUID orderId,@PathVariable UUID id){return ok(previews.support(orderId,id,null));}
    @PostMapping("/{orderId}/{id}") public ApiResponse<PreviewService.Detail> resolve(@PathVariable UUID orderId,@PathVariable UUID id,@RequestBody PreviewService.Command c){return ok(previews.support(orderId,id,c));}
    private <T> ApiResponse<T> ok(T result){return ApiResponse.<T>builder().code(1000).result(result).build();}
}
