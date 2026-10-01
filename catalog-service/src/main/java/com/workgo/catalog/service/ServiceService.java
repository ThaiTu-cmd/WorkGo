package com.workgo.catalog.service;

import com.workgo.catalog.dto.request.ServiceCreationRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.mapper.ServiceMapper;
import com.workgo.catalog.repository.CategoryRepository;
import com.workgo.catalog.repository.ServiceRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

@Service
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceService {

    ServiceRepository serviceRepository;
    ServiceMapper serviceMapper;
    CategoryRepository categoryRepository;

    public ServiceCreationResponse createService(ServiceCreationRequest request){
        if(serviceRepository.existsBySlug(request.getSlug())){
            throw new AppException(ErrorCode.SERVICE_EXISTED);
        }

        if(request.getCategoryId() == null || categoryRepository.existsById(request.getCategoryId())){
            throw new AppException(ErrorCode.CATEGORY_NOT_EXISTED);
        }




        return null;
    }

}
