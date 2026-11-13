package com.workgo.job.service;

import com.workgo.job.dto.request.*;
import com.workgo.job.dto.response.*;
import com.workgo.job.entity.*;
import com.workgo.job.enumeration.*;
import com.workgo.job.exception.*;
import com.workgo.job.mapper.*;
import com.workgo.job.repository.*;
import com.workgo.job.repository.client.CatalogClient;
import com.workgo.job.utils.TokenUtils;
import feign.FeignException;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobService {
    private final JobRepository jobs;
    private final JobAttachmentRepository attachments;
    private final ApplicationRepository applications;
    private final ProposalRepository proposals;
    private final CatalogClient catalog;
    private final JobMapper mapper;
    private final JobAttachmentMapper attachmentMapper;
    private final JobAccess access;
    private final TokenUtils token;
    private static final Set<String> SORTS = Set.of("createdAt", "deadlineAt", "budgetMin", "budgetMax", "title");

    public PageResponse<JobSummaryDto> search(String keyword, UUID categoryId, ExecutionType type,
            BigDecimal min, BigDecimal max, int page, int size, String sort) {
        budget(min, max);
        if (keyword != null && keyword.length() > 255) throw new AppException(ErrorCode.INVALID_REQUEST);
        return Pages.response(jobs.searchOpenJobs(keyword, categoryId, type, min, max, Instant.now(),
                Pages.request(page, size, sort, SORTS)).map(j -> mapper.toSummary(j, applications.countByJob_JobId(j.getJobId()))));
    }

    public PageResponse<JobSummaryDto> mine(int page, int size, String sort) {
        access.role("ROLE_CLIENT");
        return Pages.response(jobs.findByClientId(token.getCurrentUserId(), Pages.request(page, size, sort, SORTS))
                .map(j -> mapper.toSummary(j, applications.countByJob_JobId(j.getJobId()))));
    }

    public JobDetailDto detail(UUID id) {
        Job job = access.read(id);
        boolean owner = false;
        try { owner = job.getClientId().equals(token.getCurrentUserId()) && token.hasRole("ROLE_CLIENT"); }
        catch (AuthenticationException ignored) { /* Anonymous visitors can read public jobs. */ }
        if (!owner && (job.getStatus() != JobStatus.OPEN ||
                job.getDeadlineAt() != null && !job.getDeadlineAt().isAfter(Instant.now()))) throw new JobNotFoundException();
        return detail(job);
    }

    @Transactional
    public JobDetailDto create(JobCreateReq req) {
        access.role("ROLE_CLIENT");
        budget(req.budgetMin(), req.budgetMax());
        if (req.deadlineAt() != null && !req.deadlineAt().isAfter(Instant.now())) throw new AppException(ErrorCode.JOB_DEADLINE_PASSED);
        if ((req.executionType() == ExecutionType.ONSITE || req.executionType() == ExecutionType.DELIVERY)
                && (req.locationSnapshot() == null || req.locationSnapshot().isBlank())) throw new AppException(ErrorCode.LOCATION_REQUIRED);
        validateAttachments(req.attachments());
        try {
            var category = catalog.getCategory(req.categoryId());
            if (category == null || category.getCode() != 1000 || category.getResult() == null ||
                    !req.categoryId().equals(category.getResult().getCategoryId())) throw new AppException(ErrorCode.INVALID_REQUEST);
        } catch (FeignException ex) {
            throw new AppException(ex.status() == 404 ? ErrorCode.INVALID_REQUEST : ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        Job job = mapper.toEntity(req);
        job.setClientId(token.getCurrentUserId());
        jobs.saveAndFlush(job);
        if (req.attachments() != null) for (var file : req.attachments()) {
            JobAttachment attachment = attachmentMapper.toEntity(file);
            attachment.setJob(job);
            job.getAttachments().add(attachments.save(attachment));
        }
        attachments.flush();
        return detail(job);
    }

    @Transactional
    public JobDetailDto update(UUID id, JobUpdateReq req) {
        Job job = access.lock(id);
        access.owner(job);
        boolean content = req.title() != null || req.description() != null;
        if (content && req.status() != null) throw new AppException(ErrorCode.INVALID_REQUEST);
        if (!content && req.status() == null) throw new AppException(ErrorCode.INVALID_REQUEST);
        if (job.getStatus() != JobStatus.OPEN && job.getStatus() != JobStatus.PAUSED)
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        if (content) {
            if (proposals.existsByJob_JobId(id)) throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            if (job.getDeadlineAt() != null && !job.getDeadlineAt().isAfter(Instant.now())) throw new AppException(ErrorCode.JOB_DEADLINE_PASSED);
            mapper.updateContent(req, job);
        } else {
            JobStatus target = req.status();
            if (!(job.getStatus() == JobStatus.OPEN && (target == JobStatus.PAUSED || target == JobStatus.CLOSED) ||
                    job.getStatus() == JobStatus.PAUSED && (target == JobStatus.OPEN || target == JobStatus.CLOSED)))
                throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            if (target != JobStatus.CLOSED && job.getDeadlineAt() != null && !job.getDeadlineAt().isAfter(Instant.now()))
                throw new AppException(ErrorCode.JOB_DEADLINE_PASSED);
            job.setStatus(target);
        }
        jobs.flush();
        return detail(job);
    }

    private JobDetailDto detail(Job job) { return mapper.toDetail(job, new ClientBasicDto(job.getClientId(), null, null)); }

    private void budget(BigDecimal min, BigDecimal max) {
        if (min != null && min.signum() < 0 || max != null && max.signum() < 0) throw new AppException(ErrorCode.INVALID_REQUEST);
        if (min != null && max != null && min.compareTo(max) > 0) throw new AppException(ErrorCode.INVALID_BUDGET_RANGE);
    }

    private void validateAttachments(List<JobAttachmentReq> files) {
        if (files == null) return;
        if (files.size() > 10) throw new AppException(ErrorCode.INVALID_REQUEST);
        long total = 0;
        for (var f : files) {
            if (f == null || f.sizeBytes() == null || f.sizeBytes() < 0 || f.sizeBytes() > 20 * 1024 * 1024)
                throw new AppException(ErrorCode.INVALID_REQUEST);
            try {
                URI uri = URI.create(f.fileUrl());
                if (uri.getHost() == null || !Set.of("http", "https").contains(uri.getScheme())) throw new IllegalArgumentException();
            } catch (IllegalArgumentException ex) { throw new AppException(ErrorCode.INVALID_REQUEST); }
            total += f.sizeBytes();
        }
        if (total > 100 * 1024 * 1024) throw new AppException(ErrorCode.INVALID_REQUEST);
    }
}
