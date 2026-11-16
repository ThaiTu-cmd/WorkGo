package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.response.BookingSlotResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.BookingSlotService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
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
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
            ){

        return ApiResponse.<PageResponse<BookingSlotResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(bookingSlotService.getAllSlot(serviceId, from, to, page, size))
                .build();

    }

    // Hold, confirm and release are order-service only: see InternalBookingSlotController.
}
