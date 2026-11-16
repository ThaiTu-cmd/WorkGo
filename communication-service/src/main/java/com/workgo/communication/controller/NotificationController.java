package com.workgo.communication.controller;

import com.workgo.communication.dto.response.*;
import com.workgo.communication.service.NotificationService;
import com.workgo.communication.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notifications;
    private final TokenUtils tokens;

    @GetMapping
    public ApiResponse<PageResponse<NotificationDto>> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(required = false) String sort) {
        return ApiResponse.<PageResponse<NotificationDto>>builder()
                .result(notifications.list(tokens.getCurrentUserId(), unreadOnly, page, size, sort)).build();
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationDto> markRead(@PathVariable UUID id) {
        return ApiResponse.<NotificationDto>builder().result(notifications.markRead(tokens.getCurrentUserId(), id)).build();
    }

    @PostMapping("/read-all")
    public ApiResponse<Long> readAll() {
        return ApiResponse.<Long>builder().result(notifications.readAll(tokens.getCurrentUserId())).build();
    }
}
