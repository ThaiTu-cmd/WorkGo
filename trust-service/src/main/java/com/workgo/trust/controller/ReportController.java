package com.workgo.trust.controller;
import com.workgo.trust.dto.request.ReportReq;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.enumeration.*;
import com.workgo.trust.service.ReportService;
import com.workgo.trust.utils.TokenUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/reports") @RequiredArgsConstructor
public class ReportController {
    private final ReportService service;
    private final TokenUtils tokens;
    @PostMapping
    public ApiResponse<ReportDto> create(@Valid @RequestBody ReportReq req) {
        return ApiResponse.<ReportDto>builder().result(service.create(req,tokens.getCurrentUserId(),tokens.getCurrentProviderIdOrNull())).build();
    }
    @GetMapping("/{id}")
    public ApiResponse<ReportDto> get(@PathVariable UUID id) {
        return ApiResponse.<ReportDto>builder().result(service.get(id,tokens.getCurrentUserId())).build();
    }
    @GetMapping("/my-reports")
    public ApiResponse<PageResponse<ReportDto>> mine(@RequestParam(required=false) ReportStatus status,@RequestParam(required=false) ReportTargetType targetType,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<PageResponse<ReportDto>>builder().result(service.myReports(tokens.getCurrentUserId(),status,targetType,page,size)).build();
    }
}
