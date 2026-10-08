package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.AddOnCreationRequest;
import com.workgo.catalog.dto.request.AddOnUpdateRequest;
import com.workgo.catalog.dto.response.AddOnResponse;
import com.workgo.catalog.entity.AddOn;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.AddOnMapper;
import com.workgo.catalog.repository.AddOnRepository;
import com.workgo.catalog.repository.ServiceRepository;
import com.workgo.catalog.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AddOnService {

    AddOnRepository addOnRepository;
    AddOnMapper addOnMapper;
    ServiceRepository serviceRepository;
    TokenUtils tokenUtils;

    public AddOnResponse createAddOn(UUID serviceId, AddOnCreationRequest request){

        com.workgo.catalog.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_EXISTED));

        AddOn addOn = AddOn.builder()
                .currency(request.getCurrency())
                .description(request.getDescription())
                .name(request.getName())
                .price(request.getPrice())
                .service(service)
                .build();

        AddOn savedAddOn = addOnRepository.save(addOn);

        return addOnMapper.toAddOnResponse(savedAddOn);
    }

    public PageResponse<AddOnResponse> getAllByService(UUID serviceId, int page, int size){

        if(!serviceRepository.existsById(serviceId)){
            throw new AppException(ErrorCode.SERVICE_NOT_EXISTED);
        }

        Sort sort =Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = addOnRepository.findAllByService_ServiceId(serviceId, pageable);

        return PageResponse.<AddOnResponse>builder()
                .pageSize(pageData.getSize())
                .currentPage(page)
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(addOnMapper::toAddOnResponse)
                        .toList())
                .build();
    }

    public AddOnResponse getAddOn(UUID id){

        AddOn addOn = addOnRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ADD_ON_NOT_EXISTED));

        return addOnMapper.toAddOnResponse(addOn);
    }

    public AddOnResponse updateAddOn(UUID id, AddOnUpdateRequest request){
        AddOn addOn = addOnRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ADD_ON_NOT_EXISTED));

        addOnMapper.updateAddOn(addOn, request);

        AddOn savedAddOn = addOnRepository.save(addOn);

        return addOnMapper.toAddOnResponse(savedAddOn);
    }

    public void deleteAddOn(UUID id){
        AddOn addOn = addOnRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ADD_ON_NOT_EXISTED));

        addOn.setIsDeleted(tokenUtils.createDeletedMark());

        addOnRepository.save(addOn);
    }


}
