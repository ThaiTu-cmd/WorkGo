package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.SlotActionRequest;
import com.workgo.catalog.dto.response.BookingSlotResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.BookingSlotService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level =  AccessLevel.PRIVATE)
@RequestMapping("/slots")
public class BookingSlotController {

    BookingSlotService bookingSlotService;

    @GetMapping("/services/{serviceId}")
    ApiResponse<PageResponse<BookingSlotResponse>> getAllSlotByService(
            @PathVariable UUID serviceId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
            ){

        return ApiResponse.<PageResponse<BookingSlotResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(bookingSlotService.getAllSlot(serviceId, page, size))
                .build();

    }

    @PostMapping("/{slotId}/hold")
    ApiResponse<BookingSlotResponse> holdSlot(
            @PathVariable UUID slotId,
            @RequestBody SlotActionRequest request
            ){

        return ApiResponse.<BookingSlotResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(bookingSlotService.holdSlot(slotId, request.getOrderId()))
                .build();

    }


    @PostMapping("/{slotId}/confirm")
    ApiResponse<BookingSlotResponse> confirmSlot(
            @PathVariable UUID slotId,
            @RequestBody SlotActionRequest request
    ){

        return ApiResponse.<BookingSlotResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(bookingSlotService.confirmSlot(slotId, request.getOrderId()))
                .build();

    }

    @PostMapping("/{slotId}/release")
    ApiResponse<BookingSlotResponse> releaseSlot(
            @PathVariable UUID slotId,
            @RequestBody SlotActionRequest request
    ){

        return ApiResponse.<BookingSlotResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(bookingSlotService.releaseSlot(slotId, request.getOrderId()))
                .build();

    }


}
