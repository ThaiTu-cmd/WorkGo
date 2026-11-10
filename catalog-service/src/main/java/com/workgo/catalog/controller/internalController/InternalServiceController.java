package com.workgo.catalog.controller.internalController;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.ServiceCreationRequest;
import com.workgo.catalog.dto.request.ServiceUpdateRequest;
import com.workgo.catalog.dto.response.ServiceCreationResponse;
import com.workgo.catalog.dto.response.ServiceResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.ServiceService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/services")
public class InternalServiceController {

    ServiceService serviceService;

    @GetMapping("/{serviceId}")
    ServiceResponse getService(
            @PathVariable UUID serviceId
    ) {
        return serviceService.getService(serviceId);
    }

}