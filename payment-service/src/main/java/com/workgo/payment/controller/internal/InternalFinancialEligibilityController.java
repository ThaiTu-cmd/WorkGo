package com.workgo.payment.controller.internal;

import com.workgo.payment.dto.response.FinancialEligibilityResponse;
import com.workgo.payment.service.FeeReceivableService;
import com.workgo.payment.service.ProviderAccountService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

//order / job hoi truoc khi provider nhan viec moi
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/providers")
public class InternalFinancialEligibilityController {

    FeeReceivableService feeReceivableService;
    ProviderAccountService providerAccountService;

    @GetMapping("/{providerId}/financial-eligibility")
    FinancialEligibilityResponse getEligibility(@PathVariable UUID providerId) {
        return feeReceivableService.eligibilityOf(providerAccountService.userIdOf(providerId));
    }

}
