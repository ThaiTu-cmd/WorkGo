package com.workgo.trust.controller;

import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.entity.PrivateEvidence;
import com.workgo.trust.service.PrivateEvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PrivateEvidenceController {
    private final PrivateEvidenceService service;

    @PostMapping(value = "/disputes/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PrivateEvidence> upload(
            @PathVariable UUID id,
            @RequestPart MultipartFile file,
            @RequestParam(value = "sha256", required = false) String querySha256,
            @RequestHeader(value = "X-Content-Sha256", required = false) String headerSha256) {
        String expectedSha = querySha256 != null && !querySha256.isBlank() ? querySha256 : headerSha256;
        return ApiResponse.<PrivateEvidence>builder().result(service.upload(id, file, expectedSha)).build();
    }

    @GetMapping("/disputes/{id}/evidence")
    public ApiResponse<List<PrivateEvidence>> list(@PathVariable UUID id) {
        return ApiResponse.<List<PrivateEvidence>>builder().result(service.list(id)).build();
    }

    @GetMapping("/evidence/{id}/download-url")
    public ApiResponse<PrivateEvidenceService.Download> download(@PathVariable UUID id) {
        return ApiResponse.<PrivateEvidenceService.Download>builder().result(service.download(id)).build();
    }

    @GetMapping("/evidence/{id}/content")
    public ResponseEntity<byte[]> content(@PathVariable UUID id, @RequestParam long expires, @RequestParam String signature) {
        var file = service.content(id, expires, signature);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.mime()))
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                .cacheControl(CacheControl.noStore())
                .body(file.bytes());
    }
}
