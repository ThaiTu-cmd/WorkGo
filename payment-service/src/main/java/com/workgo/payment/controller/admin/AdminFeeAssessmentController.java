package com.workgo.payment.controller.admin;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.response.FeeAssessmentResponse;
import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.FeeAssessmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/admin/fee-assessments")
public class AdminFeeAssessmentController {

    FeeAssessmentService feeAssessmentService;

    //SUPER_ADMIN xem cac khoan phi chua thu (OUTSTANDING) / da thu / mien
    @GetMapping
    ApiResponse<List<FeeAssessmentResponse>> getByStatus(
            @RequestParam(value = "status", defaultValue = "OUTSTANDING") FeeAssessmentStatus status
            ){
        return ApiResponse.<List<FeeAssessmentResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(feeAssessmentService.getByStatus(status))
                .build();
    }

}
