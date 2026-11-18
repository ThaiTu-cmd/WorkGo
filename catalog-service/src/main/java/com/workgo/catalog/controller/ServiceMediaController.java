package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceMediaCreationRequest;
import com.workgo.catalog.dto.request.ServiceMediaUpdateRequest;
import com.workgo.catalog.dto.response.ServiceMediaResponse;
import com.workgo.catalog.entity.ServiceMedia;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.ServiceMediaService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/medias")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceMediaController {

    ServiceMediaService serviceMediaService;

    // them media vao mot service
    @PostMapping("/services/{serviceId}")
    ApiResponse<ServiceMediaResponse> createServiceMedia(
            @PathVariable UUID serviceId,
            @RequestBody ServiceMediaCreationRequest request
    ) {
        return ApiResponse.<ServiceMediaResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceMediaService.createServiceMedia(serviceId, request))
                .build();
    }


    // lay danh sach media cua service
    @GetMapping("/services/{serviceId}")
    ApiResponse<PageResponse<ServiceMediaResponse>> getServiceMediaByService(
            @PathVariable UUID serviceId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<ServiceMediaResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceMediaService.getServiceMediaByService(serviceId, page, size))
                .build();
    }

    // lay mot media cu the
    @GetMapping("/{serviceMediaId}")
    ApiResponse<ServiceMediaResponse> getServiceMedia(
            @PathVariable UUID serviceMediaId
    ) {
        return ApiResponse.<ServiceMediaResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceMediaService.getServiceMedia(serviceMediaId))
                .build();
    }

    // cap nhat media
    @PutMapping("/{serviceMediaId}")
    ApiResponse<ServiceMediaResponse> updateServiceMedia(
            @PathVariable UUID serviceMediaId,
            @RequestBody ServiceMediaUpdateRequest request
    ) {
        return ApiResponse.<ServiceMediaResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceMediaService.updateServiceMedia(serviceMediaId, request))
                .build();
    }

    // soft delete media
    @DeleteMapping("/{serviceMediaId}")
    ApiResponse<Void> deleteServiceMedia(
            @PathVariable UUID serviceMediaId
    ) {

        serviceMediaService.deleteServiceMedia(serviceMediaId);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }

    @PostMapping(value = "/services/{serviceId}/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<ServiceMediaResponse> uploadServiceMedia(
            @PathVariable UUID serviceId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "cover", defaultValue = "false") boolean cover
    ) {
        return ApiResponse.<ServiceMediaResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(serviceMediaService.uploadServiceMedia(serviceId, file, cover))
                .build();
    }

    @GetMapping("/{serviceMediaId}/content")
    ResponseEntity<byte[]> getContent(@PathVariable UUID serviceMediaId) {

        ServiceMedia serviceMedia = serviceMediaService.loadUploadedMedia(serviceMediaId);

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(serviceMedia.getMimeType()))
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                .body(serviceMediaService.readStoredContent(serviceMedia));
    }
}
