package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.AvailableRuleCreationRequest;
import com.workgo.catalog.dto.request.AvailableRuleUpdateRequest;
import com.workgo.catalog.dto.response.AvailableRuleResponse;
import com.workgo.catalog.entity.AvailableRule;
import com.workgo.catalog.enumeration.RuleStatus;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.AvailableRuleMapper;
import com.workgo.catalog.repository.AvailableRuleRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AvailableRuleService {

    AvailableRuleRepository availableRuleRepository;
    AvailableRuleMapper availableRuleMapper;
    ServiceRepository serviceRepository;
    TokenUtils tokenUtils;
    BookingSlotService bookingSlotService;

    @Transactional
    public AvailableRuleResponse createAvailableRule(
            UUID serviceId, AvailableRuleCreationRequest request){

        com.workgo.catalog.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(service);

        AvailableRule rule = AvailableRule.builder()
                .status(request.getStatus() != null ? request.getStatus() : RuleStatus.ACTIVE)
                .slotDurationMinute(request.getSlotDurationMinute())
                .endTime(request.getEndTime())
                .startTime(request.getStartTime())
                .dayOfWeek(request.getDayOfWeek())
                .service(service)
                .build();

        validateRule(rule);

        AvailableRule savedRule = availableRuleRepository.save(rule);

        bookingSlotService.generateSlotsForRule(savedRule);

        return availableRuleMapper.toAvailableRuleResponse(savedRule);
    }

    public PageResponse<AvailableRuleResponse> getAllRuleByService(
            UUID serviceId, int page, int size
    ){

        if(!serviceRepository.existsById(serviceId)){
            throw new AppException(ErrorCode.SERVICE_NOT_EXISTED);
        }

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = availableRuleRepository.findAllByService_ServiceId(serviceId, pageable);

        return PageResponse.<AvailableRuleResponse>builder()
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .currentPage(page)
                .pageSize(pageData.getSize())
                .data(pageData.stream()
                        .map(availableRuleMapper::toAvailableRuleResponse)
                        .toList())
                .build();
    }

    public AvailableRuleResponse getRule(UUID id){

        AvailableRule rule = availableRuleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RULE_NOT_EXISTED));

        return availableRuleMapper.toAvailableRuleResponse(rule);
    }

    @Transactional
    public AvailableRuleResponse updateRule(UUID id, AvailableRuleUpdateRequest request){
        AvailableRule rule = availableRuleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RULE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(rule.getService());

        availableRuleMapper.updateRule(rule, request);

        validateRule(rule);

        AvailableRule savedRule = availableRuleRepository.save(rule);

        bookingSlotService.regenerateSlotsForRule(savedRule);

        return availableRuleMapper.toAvailableRuleResponse(savedRule);
    }

    @Transactional
    public void deleteRule(UUID id){
        AvailableRule rule = availableRuleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RULE_NOT_EXISTED));

        tokenUtils.assertServiceOwner(rule.getService());

        rule.setIsDeleted(tokenUtils.createDeletedMark());

        availableRuleRepository.save(rule);

        bookingSlotService.removeUpcomingSlots(rule.getAvailableRuleId());

    }

    private void validateRule(AvailableRule rule){

        // A rule covers at most one day: 08:00–24:00 is fine, 08:00 to 08:00 two days later is not.
        if(rule.getStartTime() == null || rule.getEndTime() == null
                || !rule.getEndTime().isAfter(rule.getStartTime())
                || Duration.between(rule.getStartTime(), rule.getEndTime()).compareTo(Duration.ofDays(1)) > 0){
            throw new AppException(ErrorCode.INVALID_START_END_TIME);
        }

        if(rule.getSlotDurationMinute() <= 0){
            throw new AppException(ErrorCode.INVALID_SLOT_DURATION);
        }

        if(rule.getDayOfWeek() < 2 || rule.getDayOfWeek() > 8){
            throw new AppException(ErrorCode.INVALID_DAY_OF_WEEK);
        }
    }

}
