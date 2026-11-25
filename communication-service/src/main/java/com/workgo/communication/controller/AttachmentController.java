package com.workgo.communication.controller;

import com.workgo.communication.dto.response.ApiResponse;
import com.workgo.communication.service.AttachmentVerificationService;
import com.workgo.communication.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
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

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentVerificationService attachments;
    private final TokenUtils tokens;

    @PostMapping(value = "/conversations/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AttachmentVerificationService.FileDescriptor> upload(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "sha256", required = false) String querySha256,
            @RequestHeader(value = "X-Content-Sha256", required = false) String headerSha256) {
        String expectedSha = querySha256 != null && !querySha256.isBlank() ? querySha256 : headerSha256;
        return ApiResponse.<AttachmentVerificationService.FileDescriptor>builder()
                .result(attachments.upload(tokens.getCurrentUserId(), id, file, expectedSha))
                .build();
    }

    @GetMapping("/conversations/{id}/attachments/{attachmentId}/download-url")
    public ApiResponse<AttachmentVerificationService.Download> downloadUrl(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        return ApiResponse.<AttachmentVerificationService.Download>builder()
                .result(attachments.download(tokens.getCurrentUserId(), id, attachmentId))
                .build();
    }

    @GetMapping("/attachments/{attachmentId}/content")
    public ResponseEntity<byte[]> content(
            @PathVariable UUID attachmentId,
            @RequestParam("expires") long expires,
            @RequestParam("signature") String signature) {
        var file = attachments.content(tokens.getCurrentUserId(), attachmentId, expires, signature);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.mime()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(file.fileName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(file.bytes());
    }
}
