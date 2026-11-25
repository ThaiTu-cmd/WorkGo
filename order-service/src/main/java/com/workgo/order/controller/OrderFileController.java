package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.response.FileDownloadUrlResponse;
import com.workgo.order.dto.response.StoredFileResponse;
import com.workgo.order.entity.StoredFile;
import com.workgo.order.enumeration.FileContext;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.OrderFileService;
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
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderFileController {

    OrderFileService orderFileService;

    @PostMapping(value = "/{orderId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<StoredFileResponse> upload(
            @PathVariable UUID orderId,
            @RequestParam("context") FileContext context,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "sha256", required = false) String querySha256,
            @RequestHeader(value = "X-Content-Sha256", required = false) String headerSha256
    ) {
        String expectedSha = querySha256 != null && !querySha256.isBlank() ? querySha256 : headerSha256;
        return ApiResponse.<StoredFileResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderFileService.upload(orderId, context, file, expectedSha))
                .build();
    }

    @GetMapping("/{orderId}/files/{fileId}/download-url")
    ApiResponse<FileDownloadUrlResponse> createDownloadUrl(
            @PathVariable UUID orderId,
            @PathVariable UUID fileId
    ) {
        return ApiResponse.<FileDownloadUrlResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(orderFileService.createDownloadUrl(orderId, fileId))
                .build();
    }

    @GetMapping("/files/{fileId}/content")
    ResponseEntity<byte[]> download(
            @PathVariable UUID fileId,
            @RequestParam("expires") long expires,
            @RequestParam("signature") String signature
    ) {
        StoredFile storedFile = orderFileService.loadSignedFile(fileId, expires, signature);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(storedFile.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(storedFile.getOriginalName(), StandardCharsets.UTF_8)
                        .build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(orderFileService.readStoredContent(storedFile));
    }
}
