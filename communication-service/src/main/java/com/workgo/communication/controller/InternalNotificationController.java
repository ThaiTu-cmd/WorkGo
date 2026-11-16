package com.workgo.communication.controller;

import com.workgo.communication.dto.request.InternalNotificationCreateReq;
import com.workgo.communication.dto.response.*;
import com.workgo.communication.service.NotificationIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {
    private final NotificationIngestionService ingestion;

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationDto>> create(@Valid @RequestBody InternalNotificationCreateReq request) {
        var result = ingestion.ingest(request);
        return ResponseEntity.status(result.created() ? 201 : 200)
                .body(ApiResponse.<NotificationDto>builder().result(result.notification()).build());
    }
}
