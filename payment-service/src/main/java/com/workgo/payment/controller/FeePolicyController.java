package com.workgo.payment.controller;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.response.FeePolicyResponse;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.FeePolicyService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//user xem muc phi dang ap dung truoc khi chot don
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/fee-policies")
public class FeePolicyController {

    FeePolicyService feePolicyService;

    @GetMapping("/current")
    ApiResponse<FeePolicyResponse> getCurrent(){
        return ApiResponse.<FeePolicyResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(feePolicyService.getCurrent())
                .build();
    }

}
