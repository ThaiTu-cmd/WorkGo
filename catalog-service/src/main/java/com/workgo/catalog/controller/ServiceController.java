//package com.workgo.catalog.controller;
//
//import com.workgo.catalog.dto.ApiResponse;
//import com.workgo.catalog.dto.request.CategoryCreationRequest;
//import com.workgo.catalog.dto.request.ServiceCreationRequest;
//import com.workgo.catalog.dto.response.CategoryCreationResponse;
//import com.workgo.catalog.dto.response.ServiceCreationResponse;
//import com.workgo.catalog.exception.ErrorCode;
//import com.workgo.catalog.service.ServiceService;
//import lombok.AccessLevel;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequiredArgsConstructor
//@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
//@RequestMapping("/services")
//public class ServiceController {
//
//    ServiceService serviceService;
//
//    @PostMapping
//    ApiResponse<ServiceCreationResponse> createService(
//            @RequestBody ServiceCreationRequest request
//            ){
//        return ApiResponse.<ServiceCreationResponse>builder()
//                .code(ErrorCode.SUCCESS.getCode())
//                .message(ErrorCode.SUCCESS.getMessage())
//                .result(serviceService.createService(request))
//                .build();
//    }
//
//
//}
