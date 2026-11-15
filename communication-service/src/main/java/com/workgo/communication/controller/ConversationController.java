package com.workgo.communication.controller;

import com.workgo.communication.dto.request.ConversationCreateReq;
import com.workgo.communication.dto.response.*;
import com.workgo.communication.service.ConversationService;
import com.workgo.communication.utils.TokenUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversations;
    private final TokenUtils tokens;

    @GetMapping
    public ApiResponse<PageResponse<ConversationDto>> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String sort) {
        return ApiResponse.<PageResponse<ConversationDto>>builder()
                .result(conversations.list(tokens.getCurrentUserId(), page, size, sort)).build();
    }

    @PostMapping
    public ApiResponse<ConversationDto> create(@Valid @RequestBody ConversationCreateReq request) {
        return ApiResponse.<ConversationDto>builder().result(conversations.create(tokens.getCurrentUserId(), request)).build();
    }
}
