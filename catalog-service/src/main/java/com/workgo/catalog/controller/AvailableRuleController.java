package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.AvailableRuleCreationRequest;
import com.workgo.catalog.dto.request.AvailableRuleUpdateRequest;
import com.workgo.catalog.dto.response.AvailableRuleResponse;
import com.workgo.catalog.entity.AvailableRule;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.AvailableRuleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.apache.kafka.shaded.com.google.protobuf.Api;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/rules")
public class AvailableRuleController {

    AvailableRuleService availableRuleService;

    //tao mot rule cho service
    @PostMapping("/services/{serviceId}")
    public ApiResponse<AvailableRuleResponse> createRule(
            @PathVariable UUID serviceId,
            @RequestBody AvailableRuleCreationRequest request
            ){

        return ApiResponse.<AvailableRuleResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(availableRuleService.createAvailableRule(serviceId, request))
                .build();
    }

    //lay tat ca rule cua mot service cu the
    @GetMapping("/services/{serviceId}")
    ApiResponse<PageResponse<AvailableRuleResponse>> getAllRuleByService(
            @PathVariable UUID serviceId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ){
        return ApiResponse.<PageResponse<AvailableRuleResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(availableRuleService.getAllRuleByService(serviceId, page, size))
                .build();
    }

    //lay mot rule cu the
    @GetMapping("/{ruleId}")
    ApiResponse<AvailableRuleResponse> getRule(
            @PathVariable UUID ruleId
    ){
        return ApiResponse.<AvailableRuleResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(availableRuleService.getRule(ruleId))
                .build();
    }


    //cap nhat mot rule
    @PutMapping("/{ruleId}")
    public ApiResponse<AvailableRuleResponse> updateRule(
            @PathVariable UUID ruleId,
            @RequestBody AvailableRuleUpdateRequest request
            ){
        return ApiResponse.<AvailableRuleResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(availableRuleService.updateRule(ruleId, request))
                .build();
    }


    //xoa mem mot rule
    @DeleteMapping("/{ruleId}")
    public ApiResponse<Void> deleteRule(
            @PathVariable UUID ruleId
    ){
        availableRuleService.deleteRule(ruleId);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }
}
