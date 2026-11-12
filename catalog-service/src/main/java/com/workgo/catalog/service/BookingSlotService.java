package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.response.BookingSlotResponse;
import com.workgo.catalog.entity.AvailableRule;
import com.workgo.catalog.entity.BookingSlot;
import com.workgo.catalog.enumeration.BookingStatus;
import com.workgo.catalog.enumeration.RuleStatus;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.BookingSlotMapper;
import com.workgo.catalog.repository.AvailableRuleRepository;
import com.workgo.catalog.repository.BookingSlotRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class BookingSlotService {

    private static final ZoneId SLOT_ZONE = ZoneOffset.ofHours(7);
    private static final int SLOT_GENERATE_DAYS = 28;

    BookingSlotRepository bookingSlotRepository;
    AvailableRuleRepository availableRuleRepository;
    ServiceRepository serviceRepository;
    BookingSlotMapper bookingSlotMapper;
    TokenUtils tokenUtils;


    public PageResponse<BookingSlotResponse> getAllSlot(UUID serviceId, Instant from, Instant to, int page, int size){

        if(!serviceRepository.existsById(serviceId)){
            throw new AppException(ErrorCode.SERVICE_NOT_EXISTED);
        }

        Instant fromTime = from != null ? from : Instant.now();
        Instant toTime = to != null ? to : fromTime.plus(Duration.ofDays(SLOT_GENERATE_DAYS));

        if(toTime.isBefore(fromTime)){
            throw new AppException(ErrorCode.INVALID_START_END_TIME);
        }

        Sort sort = Sort.by("startedAt").ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = bookingSlotRepository.findAllByService_ServiceIdAndStartedAtBetween(serviceId, fromTime, toTime, pageable);

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
    public void generateSlotsForRule(AvailableRule rule){

        if(rule.getStatus() != RuleStatus.ACTIVE
                || rule.getStartTime() == null
                || rule.getEndTime() == null
                || rule.getSlotDurationMinute() <= 0
                || rule.getDayOfWeek() < 2
                || rule.getDayOfWeek() > 8) return;

        LocalDate fromDate = LocalDate.now(SLOT_ZONE);
        LocalDate toDate = fromDate.plusDays(SLOT_GENERATE_DAYS);

        Instant fromTime = fromDate.atStartOfDay(SLOT_ZONE).toInstant();
        Instant toTime = toDate.atStartOfDay(SLOT_ZONE).toInstant();

        com.workgo.catalog.entity.Service service = rule.getService();

        Set<Instant> existedStarts = bookingSlotRepository
                .findAllByService_ServiceIdAndStartedAtBetween(service.getServiceId(), fromTime, toTime)
                .stream()
                .map(BookingSlot::getStartedAt)
                .collect(Collectors.toSet());

        DayOfWeek dayOfWeek = DayOfWeek.of(rule.getDayOfWeek() - 1);
        int startMinute = rule.getStartTime().atZone(SLOT_ZONE).toLocalTime().toSecondOfDay() / 60;
        int endMinute = rule.getEndTime().atZone(SLOT_ZONE).toLocalTime().toSecondOfDay() / 60;
        int duration = rule.getSlotDurationMinute();

        Instant now = Instant.now();
        List<BookingSlot> slots = new ArrayList<>();

        fromDate.datesUntil(toDate)
                .filter(date -> date.getDayOfWeek() == dayOfWeek)
                .forEach(date -> {
                    for(int minute = startMinute; minute + duration <= endMinute; minute += duration){

                        Instant startedAt = date.atTime(LocalTime.ofSecondOfDay(minute * 60L))
                                .atZone(SLOT_ZONE)
                                .toInstant();

                        if(!startedAt.isAfter(now) || !existedStarts.add(startedAt)) continue;

                        slots.add(BookingSlot.builder()
                                .startedAt(startedAt)
                                .endAt(startedAt.plus(Duration.ofMinutes(duration)))
                                .service(service)
                                .availableRuleId(rule.getAvailableRuleId())
                                .updatedAt(now)
                                .build());
                    }
                });

        bookingSlotRepository.saveAll(slots);
    }

    @Transactional
    public void regenerateSlotsForRule(AvailableRule rule){

        removeUpcomingSlots(rule.getAvailableRuleId());

        generateSlotsForRule(rule);
    }

    @Transactional
    public void removeUpcomingSlots(UUID ruleId){

        bookingSlotRepository.deleteAllByAvailableRuleIdAndStatusAndStartedAtAfter(
                ruleId, BookingStatus.AVAILABLE, Instant.now());
    }

    @Transactional
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Ho_Chi_Minh")
    public void generateUpcomingSlots(){

        availableRuleRepository.findAllByStatus(RuleStatus.ACTIVE)
                .forEach(this::generateSlotsForRule);
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
