package com.workgo.job.service;

import com.workgo.job.entity.Job;
import com.workgo.job.enumeration.JobStatus;
import com.workgo.job.exception.*;
import com.workgo.job.repository.JobRepository;
import com.workgo.job.utils.TokenUtils;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JobAccess {
    private final JobRepository jobs;
    private final TokenUtils token;

    public void role(String role) {
        if (!token.hasRole(role)) throw new AccessDeniedException("Role required");
    }

    public Job read(UUID id) { return jobs.findById(id).orElseThrow(JobNotFoundException::new); }
    public Job lock(UUID id) { return jobs.findLockedById(id).orElseThrow(JobNotFoundException::new); }

    public void owner(Job job) {
        role("ROLE_CLIENT");
        if (!job.getClientId().equals(token.getCurrentUserId())) throw new AccessDeniedException("Job owner required");
    }

    public void open(Job job) {
        if (job.getStatus() != JobStatus.OPEN) throw new JobNotOpenException();
        if (job.getDeadlineAt() != null && !job.getDeadlineAt().isAfter(Instant.now()))
            throw new AppException(ErrorCode.JOB_DEADLINE_PASSED);
    }
}
