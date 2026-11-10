package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.response.BookingSlotResponse;
import com.workgo.catalog.entity.BookingSlot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BookingSlotMapper {

    @Mapping(target = "service", source = "service.serviceId")
    BookingSlotResponse toBookingSlotResponse(BookingSlot bookingSlot);
//
//    void updateBookingSlot(@MappingTarget BookingSlot bookingSlot, BookingSlotUpdateRequest request);

}
