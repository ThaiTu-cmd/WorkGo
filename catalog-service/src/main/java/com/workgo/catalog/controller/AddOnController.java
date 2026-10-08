package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.AddOnCreationRequest;
import com.workgo.catalog.dto.request.AddOnUpdateRequest;
import com.workgo.catalog.dto.response.AddOnResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.AddOnService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping(value = "/addons")
public class AddOnController {

    AddOnService addOnService;

    //tao mot add on cho 1 service cu the
    @PostMapping("/service/{serviceId}")
    ApiResponse<AddOnResponse> createAddOn(
            @PathVariable UUID serviceId,
            @RequestBody AddOnCreationRequest request
            ){
        return ApiResponse.<AddOnResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addOnService.createAddOn(serviceId, request))
                .build();
    }

    //lay tat ca cac add on cua mot service cu the
    @GetMapping("/service/{serviceId}")
    ApiResponse<PageResponse<AddOnResponse>> getAllByService(
            @PathVariable UUID serviceId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ){
        return ApiResponse.<PageResponse<AddOnResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addOnService.getAllByService(serviceId, page,size))
                .build();
    }

    //lay mot add on chi dinh
    @GetMapping("/{addonId}")
    ApiResponse<AddOnResponse> getAddOn(
            @PathVariable UUID addonId
            ){
        return ApiResponse.<AddOnResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addOnService.getAddOn(addonId))
                .build();
    }

    //cap nhat mot add on cu the
    @PutMapping("/{addonId}")
    ApiResponse<AddOnResponse> updateAddOn(
            @PathVariable UUID addonId,
            @RequestBody AddOnUpdateRequest request
    ){
        return ApiResponse.<AddOnResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addOnService.updateAddOn(addonId, request))
                .build();
    }

    //xoa mem mot add on
    @DeleteMapping("/{addonId}")
    ApiResponse<Void> deleteAddOn(
            @PathVariable UUID addonId
    ){
        addOnService.deleteAddOn(addonId);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }
}
