package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.response.BookingSlotResponse;
import com.workgo.catalog.entity.BookingSlot;
import com.workgo.catalog.enumeration.BookingStatus;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.BookingSlotMapper;
import com.workgo.catalog.repository.BookingSlotRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class BookingSlotService {

    BookingSlotRepository bookingSlotRepository;
    ServiceRepository serviceRepository;
    BookingSlotMapper bookingSlotMapper;
    TokenUtils tokenUtils;


//    public BookingSlotResponse createSlot(UUID serviceId, BookingSlotCreationRequest request){
//        com.workgo.catalog.entity.Service service = serviceRepository.findById(serviceId)
//                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));
//
//        BookingSlot bookingSlot = BookingSlot.builder()
//                .startedAt(request.getStartedAt())
//                .endAt(request.getEndAt())
//                .order(request.getOrderId())
//
//                .build();
//
//    }

    public PageResponse<BookingSlotResponse> getAllSlot(UUID serviceId, int page, int size){
        com.workgo.catalog.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = bookingSlotRepository.findAllByService_ServiceId(serviceId, pageable);

        return PageResponse.<BookingSlotResponse>builder()
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .currentPage(page)
                .data(pageData.stream()
                        .map(bookingSlotMapper::toBookingSlotResponse)
                        .toList())
                .build();
    }

    @Transactional
    public BookingSlotResponse holdSlot(UUID slotId, UUID orderId){

        BookingSlot bookingSlot = bookingSlotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_EXISTED));

        Instant now = Instant.now();

        if(!bookingSlot.getStartedAt().isAfter(now)){
            throw new AppException(ErrorCode.SLOT_IN_PAST);
        }

        boolean holdExpired = bookingSlot.getStatus() == BookingStatus.HELD
                && bookingSlot.getHoldExpiresAt() != null
                && !bookingSlot.getHoldExpiresAt().isAfter(now);

        if(bookingSlot.getStatus() != BookingStatus.AVAILABLE && !holdExpired){
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }

        bookingSlot.setStatus(BookingStatus.HELD);
        bookingSlot.setOrder(orderId);
        bookingSlot.setHoldExpiresAt(now.plus(Duration.ofMinutes(30)));
        bookingSlot.setUpdatedAt(now);

        BookingSlot savedSlot = bookingSlotRepository.save(bookingSlot);

        return bookingSlotMapper.toBookingSlotResponse(savedSlot);
    }

    @Transactional
    public BookingSlotResponse confirmSlot(UUID slotId, UUID orderId){

        BookingSlot bookingSlot = bookingSlotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_EXISTED));

        if(bookingSlot.getStatus() != BookingStatus.HELD
                || !orderId.equals(bookingSlot.getOrder())){
            throw new AppException(ErrorCode.SLOT_NOT_HELD_BY_ORDER);
        }

        bookingSlot.setStatus(BookingStatus.BOOKED);
        bookingSlot.setHoldExpiresAt(null);
        bookingSlot.setUpdatedAt(Instant.now());

        BookingSlot savedSlot = bookingSlotRepository.save(bookingSlot);

        return bookingSlotMapper.toBookingSlotResponse(savedSlot);
    }

    @Transactional
    public BookingSlotResponse releaseSlot(UUID slotId, UUID orderId){

        BookingSlot bookingSlot = bookingSlotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_EXISTED));

        if(bookingSlot.getStatus() == BookingStatus.AVAILABLE){
            return bookingSlotMapper.toBookingSlotResponse(bookingSlot);
        }

        if(!orderId.equals(bookingSlot.getOrder())){
            throw new AppException(ErrorCode.SLOT_NOT_HELD_BY_ORDER);
        }

        bookingSlot.setStatus(BookingStatus.AVAILABLE);
        bookingSlot.setOrder(null);
        bookingSlot.setHoldExpiresAt(null);
        bookingSlot.setUpdatedAt(Instant.now());

        BookingSlot savedSlot = bookingSlotRepository.save(bookingSlot);

        return bookingSlotMapper.toBookingSlotResponse(savedSlot);
    }

}
