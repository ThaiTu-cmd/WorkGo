package com.workgo.catalog.controller.internalController;

import com.workgo.catalog.dto.request.SlotActionRequest;
import com.workgo.catalog.dto.response.BookingSlotResponse;
import com.workgo.catalog.service.BookingSlotService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/slots")
public class InternalBookingSlotController {

    BookingSlotService bookingSlotService;

    //order-service giu slot khi tao don
    @PostMapping("/{slotId}/hold")
    public BookingSlotResponse holdSlot(
            @PathVariable UUID slotId,
            @RequestBody SlotActionRequest request
            ){

        return bookingSlotService.holdSlot(slotId, request.getOrderId());

    }

    //order-service xac nhan slot khi da thanh toan
    @PostMapping("/{slotId}/confirm")
    public BookingSlotResponse confirmSlot(
            @PathVariable UUID slotId,
            @RequestBody SlotActionRequest request
            ){

        return bookingSlotService.confirmSlot(slotId, request.getOrderId());

    }

    //order-service nha slot khi tao don loi hoac huy don
    @PostMapping("/{slotId}/release")
    public BookingSlotResponse releaseSlot(
            @PathVariable UUID slotId,
            @RequestBody SlotActionRequest request
            ){

        return bookingSlotService.releaseSlot(slotId, request.getOrderId());

    }

}
