package com.workgo.payment.controller;
import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.PayoutCreationRequest;
import com.workgo.payment.entity.VerifiedBeneficiary;
import com.workgo.payment.reppository.VerifiedBeneficiaryRepository;
import com.workgo.payment.service.PayoutSourceVerifier;
import com.workgo.payment.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/wallet/beneficiaries")
public class BeneficiaryController {
    private final VerifiedBeneficiaryRepository beneficiaries;private final PayoutSourceVerifier verifier;private final TokenUtils tokens;
    @GetMapping public ApiResponse<List<VerifiedBeneficiary>> list(){return ApiResponse.<List<VerifiedBeneficiary>>builder().code(1000).result(beneficiaries.findByUserIdAndExpiresAtAfter(tokens.getCurrentUserId(),Instant.now())).build();}
    @PostMapping @Transactional
    public ApiResponse<VerifiedBeneficiary> verified(@RequestBody PayoutCreationRequest r){
        var user=tokens.getCurrentUserId();verifier.verifyBeneficiary(user,r);
        var old=beneficiaries.findById(r.getVerifiedBeneficiaryId()).orElse(null);
        if(old!=null){
            if(!user.equals(old.getUserId())||!old.getBankCode().equals(r.getBankCode().trim())||!old.getAccountName().equals(r.getAccountName().trim())||!old.getAccountNumber().equals(r.getAccountNumber().trim())
                    ||r.getBeneficiaryEvidence()!=null&&!old.getExpiresAt().equals(Instant.parse(r.getBeneficiaryEvidence().get("expiresAt")).truncatedTo(java.time.temporal.ChronoUnit.MICROS)))
                throw new com.workgo.payment.exception.AppException(com.workgo.payment.exception.ErrorCode.PAYOUT_IDEMPOTENCY_KEY_REUSED);
            return ApiResponse.<VerifiedBeneficiary>builder().code(1000).result(old).build();
        }
        var b=new VerifiedBeneficiary();b.setId(r.getVerifiedBeneficiaryId());b.setUserId(user);b.setBankCode(r.getBankCode().trim());b.setAccountName(r.getAccountName().trim());b.setAccountNumber(r.getAccountNumber().trim());b.setVerifiedAt(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));b.setExpiresAt(Instant.parse(r.getBeneficiaryEvidence().get("expiresAt")).truncatedTo(java.time.temporal.ChronoUnit.MICROS));
        return ApiResponse.<VerifiedBeneficiary>builder().code(1000).result(beneficiaries.saveAndFlush(b)).build();
    }
}
