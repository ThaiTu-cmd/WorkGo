package com.workgo.payment.controller.internal;

import com.workgo.payment.dto.request.CashFeeRequest;
import com.workgo.payment.dto.response.FeeAssessmentResponse;
import com.workgo.payment.service.CashFeeService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/cash-fees")
public class InternalCashFeeController {

    CashFeeService cashFeeService;

    @PostMapping
    FeeAssessmentResponse recordCashFee(@RequestBody CashFeeRequest request) {
        return cashFeeService.recordCashFee(request);
    }

}
