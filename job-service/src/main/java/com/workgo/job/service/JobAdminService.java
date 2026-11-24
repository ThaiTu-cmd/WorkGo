package com.workgo.job.service;

import com.workgo.job.entity.*;
import com.workgo.job.exception.*;
import com.workgo.job.repository.*;
import com.workgo.job.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class JobAdminService {
    private final JobAccess access;
    private final JobRepository jobs;
    private final JobAdminAuditRepository audit;
    private final TokenUtils token;
    private final ApplicationRepository applications;
    @Transactional
    public Job moderate(UUID id, boolean hidden, String reason, long version) {
        access.role("ROLE_ADMIN");
        if (reason == null || reason.isBlank() || reason.length()>1000) throw new AppException(ErrorCode.INVALID_REQUEST);
        var job=access.lock(id);
        UUID provider=token.getCurrentProviderIdOrNull();
        if(job.getClientId().equals(token.getCurrentUserId())||provider!=null&&applications.existsByJob_JobIdAndProviderId(id,provider))
            throw new org.springframework.security.access.AccessDeniedException("Moderation conflict of interest");
        if (!java.util.Objects.equals(job.getVersion(),version)) throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
        if (job.isModerationHidden()==hidden) throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        audit.save(new JobAdminAudit(token.getCurrentUserId(),id,reason.strip(),job.isModerationHidden(),hidden));
        job.setModerationHidden(hidden);
        jobs.flush();
        return job;
    }
}
