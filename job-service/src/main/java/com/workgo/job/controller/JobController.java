package com.workgo.job.controller;

import com.workgo.job.dto.request.*;
import com.workgo.job.dto.response.*;
import com.workgo.job.enumeration.ExecutionType;
import com.workgo.job.service.JobAttachmentService;
import com.workgo.job.service.JobService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/jobs") @RequiredArgsConstructor
public class JobController {
    private final JobService service;
    private final JobAttachmentService attachments;

    @GetMapping
    public ApiResponse<PageResponse<JobSummaryDto>> search(@RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId, @RequestParam(required = false) ExecutionType executionType,
            @RequestParam(required = false) BigDecimal minBudget, @RequestParam(required = false) BigDecimal maxBudget,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<JobSummaryDto>>builder().result(service.search(keyword, categoryId, executionType,
                minBudget, maxBudget, page, size, sort)).build();
    }

    @GetMapping("/my-jobs") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<PageResponse<JobSummaryDto>> mine(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ApiResponse.<PageResponse<JobSummaryDto>>builder().result(service.mine(page, size, sort)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<JobDetailDto> detail(@PathVariable UUID id) {
        return ApiResponse.<JobDetailDto>builder().result(service.detail(id)).build();
    }

    @PostMapping @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<JobDetailDto> create(@Valid @RequestBody JobCreateReq req) {
        return ApiResponse.<JobDetailDto>builder().result(service.create(req)).build();
    }

    @PutMapping("/{id}") @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<JobDetailDto> update(@PathVariable UUID id, @Valid @RequestBody JobUpdateReq req) {
        return ApiResponse.<JobDetailDto>builder().result(service.update(id, req)).build();
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ApiResponse<JobAttachmentDto> uploadAttachment(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "sha256", required = false) String querySha256,
            @RequestHeader(value = "X-Content-Sha256", required = false) String headerSha256) {
        String expectedSha = querySha256 != null && !querySha256.isBlank() ? querySha256 : headerSha256;
        return ApiResponse.<JobAttachmentDto>builder().result(attachments.upload(id, file, expectedSha)).build();
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download-url")
    public ApiResponse<JobAttachmentService.Download> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        return ApiResponse.<JobAttachmentService.Download>builder()
                .result(attachments.download(id, attachmentId)).build();
    }

    @GetMapping("/attachments/{attachmentId}/content")
    public ResponseEntity<byte[]> attachmentContent(
            @PathVariable UUID attachmentId,
            @RequestParam("expires") long expires,
            @RequestParam("signature") String signature) {
        var file = attachments.content(attachmentId, expires, signature);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.mime()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(file.fileName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(file.bytes());
    }
}
