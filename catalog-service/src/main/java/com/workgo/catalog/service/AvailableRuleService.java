package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.AvailableRuleCreationRequest;
import com.workgo.catalog.dto.request.AvailableRuleUpdateRequest;
import com.workgo.catalog.dto.response.AvailableRuleResponse;
import com.workgo.catalog.entity.AvailableRule;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AvailableRuleService {

    AvailableRuleRepository availableRuleRepository;
    AvailableRuleMapper availableRuleMapper;
    ServiceRepository serviceRepository;
    TokenUtils tokenUtils;

    public AvailableRuleResponse createAvailableRule(
            UUID serviceId, AvailableRuleCreationRequest request){

        com.workgo.catalog.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        if(request.getEndTime().isBefore(request.getStartTime())){
            throw new AppException(ErrorCode.INVALID_START_END_TIME);
        }

        AvailableRule rule = AvailableRule.builder()
                .status(request.getStatus())
                .slotDurationMinute(request.getSlotDurationMinute())
                .endTime(request.getEndTime())
                .startTime(request.getStartTime())
                .dayOfWeek(request.getDayOfWeek())
                .service(service)
                .build();

        AvailableRule savedRule = availableRuleRepository.save(rule);

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

    public AvailableRuleResponse updateRule(UUID id, AvailableRuleUpdateRequest request){
        AvailableRule rule = availableRuleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RULE_NOT_EXISTED));

        if(request.getEndTime().isBefore(request.getStartTime())){
            throw new AppException(ErrorCode.INVALID_START_END_TIME);
        }

        availableRuleMapper.updateRule(rule, request);

        AvailableRule savedRule = availableRuleRepository.save(rule);

        return availableRuleMapper.toAvailableRuleResponse(savedRule);
    }

    public void deleteRule(UUID id){
        AvailableRule rule = availableRuleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RULE_NOT_EXISTED));

        rule.setIsDeleted(tokenUtils.createDeletedMark());

        AvailableRule savedRule = availableRuleRepository.save(rule);

    }

}
