package com.workgo.trust.controller;
import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.entity.ReputationLedgerEntry;
import com.workgo.trust.repository.*;
import com.workgo.trust.utils.TokenUtils;
import com.workgo.trust.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor
public class ReputationController {
    private final ReputationAccountRepository accounts;
    private final ReputationLedgerRepository ledger;
    private final TokenUtils tokens;
    public record Score(UUID providerId,int score,String policyVersion){}
    @GetMapping("/providers/{id}/reputation")
    public ApiResponse<Score> score(@PathVariable UUID id){var a=accounts.findById(id).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));return ApiResponse.<Score>builder().result(new Score(id,a.getScore(),"WG-POLICY-1.0")).build();}
    @GetMapping("/reputation/me/ledger") @PreAuthorize("hasRole('PROVIDER')")
    public ApiResponse<Page<ReputationLedgerEntry>> mine(@RequestParam(defaultValue="0") int page){return ApiResponse.<Page<ReputationLedgerEntry>>builder().result(ledger.findByProviderId(tokens.getCurrentProviderId(),PageRequest.of(Math.max(0,page),50,Sort.by("createdAt").descending()))).build();}
}
