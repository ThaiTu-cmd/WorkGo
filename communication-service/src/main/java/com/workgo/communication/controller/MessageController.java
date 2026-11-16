package com.workgo.communication.controller;

import com.workgo.communication.dto.request.MessageSendReq;
import com.workgo.communication.dto.response.*;
import com.workgo.communication.service.MessageService;
import com.workgo.communication.utils.TokenUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messages;
    private final TokenUtils tokens;

    @GetMapping("/conversations/{id}/messages")
    public ApiResponse<PageResponse<MessageDto>> list(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String sort) {
        return ApiResponse.<PageResponse<MessageDto>>builder()
                .result(messages.list(tokens.getCurrentUserId(), id, page, size, sort)).build();
    }

    @PostMapping("/conversations/{id}/messages")
    public ApiResponse<MessageDto> send(@PathVariable UUID id, @Valid @RequestBody MessageSendReq request) {
        return ApiResponse.<MessageDto>builder().result(messages.send(tokens.getCurrentUserId(), id, request)).build();
    }

    @PostMapping("/messages/{id}/read")
    public ApiResponse<MessageDto> markRead(@PathVariable UUID id) {
        return ApiResponse.<MessageDto>builder().result(messages.markRead(tokens.getCurrentUserId(), id)).build();
    }
}
