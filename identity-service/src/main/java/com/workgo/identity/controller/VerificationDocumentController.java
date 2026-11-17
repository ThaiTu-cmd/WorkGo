package com.workgo.identity.controller;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.response.FileDownloadUrlResponse;
import com.workgo.identity.dto.response.VerificationDocumentResponse;
import com.workgo.identity.entity.VerificationDocument;
import com.workgo.identity.service.VerificationDocumentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/provider-verifications")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class VerificationDocumentController {

    VerificationDocumentService verificationDocumentService;

    @PostMapping(value = "/{verificationId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<VerificationDocumentResponse> upload(
            @PathVariable UUID verificationId,
            @RequestPart("file") MultipartFile file
    ) {
        return ApiResponse.<VerificationDocumentResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(verificationDocumentService.upload(verificationId, file))
                .build();
    }

    @GetMapping("/{verificationId}/documents")
    ApiResponse<List<VerificationDocumentResponse>> getDocuments(@PathVariable UUID verificationId) {

        return ApiResponse.<List<VerificationDocumentResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(verificationDocumentService.getDocuments(verificationId))
                .build();
    }

    @GetMapping("/{verificationId}/documents/{documentId}/download-url")
    ApiResponse<FileDownloadUrlResponse> createDownloadUrl(
            @PathVariable UUID verificationId,
            @PathVariable UUID documentId
    ) {
        return ApiResponse.<FileDownloadUrlResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(verificationDocumentService.createDownloadUrl(verificationId, documentId))
                .build();
    }

    @GetMapping("/documents/{documentId}/content")
    ResponseEntity<byte[]> download(
            @PathVariable UUID documentId,
            @RequestParam("expires") long expires,
            @RequestParam("signature") String signature
    ) {
        VerificationDocument document = verificationDocumentService.loadSignedDocument(documentId, expires, signature);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(document.getOriginalName(), StandardCharsets.UTF_8)
                        .build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(verificationDocumentService.readStoredContent(document));
    }
}
