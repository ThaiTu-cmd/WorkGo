package com.workgo.job.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.job.dto.request.JobCreateReq;
import com.workgo.job.dto.response.JobDetailDto;
import com.workgo.job.exception.*;
import com.workgo.job.repository.JobRepository;
import com.workgo.job.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.util.*;

/** Persists creation identity with the Job, so a lost response never creates another draft. */
@Service @RequiredArgsConstructor @PreAuthorize("hasRole('CLIENT')")
public class JobCreationService {
    private final JobService service;
    private final JobRepository jobs;
    private final TokenUtils token;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    @Transactional
    public JobDetailDto create(JobCreateReq request,String key,boolean draft){
        if(key==null)return draft?service.createDraft(request):service.create(request);
        validateKey(key);
        UUID client=token.getCurrentUserId();
        String hash=hash(request,draft);
        // Cross-instance serialization, released only by commit/rollback; hash collisions only serialize unrelated keys.
        jdbc.queryForList("select pg_advisory_xact_lock(hashtextextended(?,0))","JOB_CREATE:"+client+":"+key);
        var old=jobs.findByClientIdAndCreationKey(client,key).orElse(null);
        if(old!=null){
            if(!hash.equals(old.getCreationHash()))throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            return service.detail(old.getJobId());
        }
        if(jobs.countCreationKeyIncludingDeleted(client,key)>0)throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
        var result=draft?service.createDraft(request):service.create(request);
        var job=jobs.findById(result.jobId()).orElseThrow(JobNotFoundException::new);
        job.setCreationKey(key);job.setCreationHash(hash);jobs.saveAndFlush(job);
        return service.detail(job.getJobId());
    }

    @Transactional(readOnly=true)
    public JobDetailDto receipt(String key){
        validateKey(key);
        var job=jobs.findByClientIdAndCreationKey(token.getCurrentUserId(),key).orElseThrow(JobNotFoundException::new);
        return service.detail(job.getJobId());
    }

    private void validateKey(String key){if(!key.matches("[A-Za-z0-9_-]{8,128}"))throw new AppException(ErrorCode.INVALID_REQUEST);}
    private BigDecimal normalized(BigDecimal value){return value==null?null:value.stripTrailingZeros();}
    private String hash(JobCreateReq r,boolean draft){
        if(r==null)throw new AppException(ErrorCode.INVALID_REQUEST);
        var normalized=new JobCreateReq(r.title(),r.description(),r.categoryId(),normalized(r.budgetMin()),normalized(r.budgetMax()),
                r.currency()==null?"VND":r.currency(),r.executionType(),r.locationSnapshot(),r.deadlineAt(),r.attachments()==null?List.of():r.attachments());
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(new Object[]{draft,normalized})));}
        catch(Exception e){throw new AppException(ErrorCode.INVALID_REQUEST);}
    }
}
