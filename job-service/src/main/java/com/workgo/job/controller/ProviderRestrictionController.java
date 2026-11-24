package com.workgo.job.controller;
import com.workgo.job.entity.ProviderRestriction;
import com.workgo.job.repository.ProviderRestrictionRepository;
import com.workgo.job.exception.*;
import com.workgo.job.dto.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/internal/providers") @RequiredArgsConstructor
public class ProviderRestrictionController {
    private final ProviderRestrictionRepository restrictions;
    public record Change(@NotBlank String source,@Min(1) long sourceVersion,boolean blocked){}
    @PutMapping("/{id}/restrictions") @Transactional
    public ApiResponse<ProviderRestriction> change(@PathVariable UUID id,@Valid @RequestBody Change req){
        if(!Set.of("FINANCIAL","SANCTION","REPUTATION").contains(req.source()))throw new AppException(ErrorCode.INVALID_REQUEST);
        var r=restrictions.findById(id+":"+req.source()).orElseGet(()->new ProviderRestriction(id,req.source()));
        if(r.getSourceVersion()==req.sourceVersion()&&r.isBlocked()!=req.blocked())throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
        if(r.getSourceVersion()<req.sourceVersion()){r.setSourceVersion(req.sourceVersion());r.setBlocked(req.blocked());restrictions.saveAndFlush(r);}
        return ApiResponse.<ProviderRestriction>builder().result(r).build();
    }
}
