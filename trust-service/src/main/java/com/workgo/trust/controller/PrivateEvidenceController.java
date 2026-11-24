package com.workgo.trust.controller;
import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.entity.PrivateEvidence;
import com.workgo.trust.service.PrivateEvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
@RestController @RequiredArgsConstructor
public class PrivateEvidenceController {
    private final PrivateEvidenceService service;
    @PostMapping(value="/disputes/{id}/evidence",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PrivateEvidence> upload(@PathVariable UUID id,@RequestPart MultipartFile file){return ApiResponse.<PrivateEvidence>builder().result(service.upload(id,file)).build();}
    @GetMapping("/disputes/{id}/evidence")
    public ApiResponse<List<PrivateEvidence>> list(@PathVariable UUID id){return ApiResponse.<List<PrivateEvidence>>builder().result(service.list(id)).build();}
    @GetMapping("/evidence/{id}/download-url")
    public ApiResponse<PrivateEvidenceService.Download> download(@PathVariable UUID id){return ApiResponse.<PrivateEvidenceService.Download>builder().result(service.download(id)).build();}
    @GetMapping("/evidence/{id}/content")
    public ResponseEntity<byte[]> content(@PathVariable UUID id,@RequestParam long expires,@RequestParam String signature){var file=service.content(id,expires,signature);return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.mime())).header("X-Content-Type-Options","nosniff")
            .header(HttpHeaders.CONTENT_DISPOSITION,"attachment").cacheControl(CacheControl.noStore()).body(file.bytes());}
}
