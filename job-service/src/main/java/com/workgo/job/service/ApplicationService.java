package com.workgo.job.service;

import com.workgo.job.dto.request.ApplicationCreateReq;
import com.workgo.job.dto.response.*;
import com.workgo.job.dto.response.client.ProviderProfileResponse;
import com.workgo.job.entity.*;
import com.workgo.job.enumeration.ApplicationStatus;
import com.workgo.job.exception.*;
import com.workgo.job.mapper.*;
import com.workgo.job.repository.*;
import com.workgo.job.repository.client.IdentityClient;
import com.workgo.job.utils.TokenUtils;
import feign.FeignException;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {
    private final ApplicationRepository applications;
    private final ProposalRepository proposals;
    private final ApplicationMapper mapper;
    private final ProposalMapper proposalMapper;
    private final IdentityClient identity;
    private final JobAccess access;
    private final TokenUtils token;

    @Transactional
    public ApplicationDto apply(UUID id, ApplicationCreateReq req) {
        access.role("ROLE_PROVIDER");
        Job job = access.lock(id);
        access.open(job);
        UUID providerId = token.getCurrentProviderId();
        ProviderProfileResponse profile = eligible(providerId);
        if (!token.getCurrentUserId().equals(profile.getUserId())) throw new AccessDeniedException("Profile identity mismatch");
        if (job.getClientId().equals(profile.getUserId())) throw new AppException(ErrorCode.CANNOT_APPLY_OWN_JOB);
        if (applications.existsByJob_JobIdAndProviderId(id, providerId)) throw new AlreadyAppliedException();
        Application app = mapper.toEntity(req);
        app.setJob(job);
        app.setProviderId(providerId);
        app.setStatus(ApplicationStatus.PENDING);
        try { applications.saveAndFlush(app); }
        catch (DataIntegrityViolationException ex) {
            if (constraint(ex, "uq_app_job_provider")) throw new AlreadyAppliedException();
            throw ex;
        }
        return mapper.toDto(app, publicProfile(profile), List.of());
    }

    public PageResponse<ApplicationDto> forJob(UUID id, int page, int size, String sort) {
        access.owner(access.read(id));
        return Pages.response(applications.findByJob_JobId(id, Pages.request(page, size, sort, Set.of("createdAt", "status"))).map(this::dto));
    }

    public PageResponse<ApplicationDto> mine(int page, int size, String sort) {
        access.role("ROLE_PROVIDER");
        return Pages.response(applications.findByProviderId(token.getCurrentProviderId(),
                Pages.request(page, size, sort, Set.of("createdAt", "status"))).map(this::dto));
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public ProviderProfileResponse eligible(UUID providerId) {
        ProviderProfileResponse profile = profile(providerId);
        if (!"ACTIVE".equals(profile.getUserStatus()) || !profile.isAcceptingOrders()) throw new AppException(ErrorCode.PROVIDER_NOT_ACTIVE);
        if (!"VERIFIED".equals(profile.getVerificationStatus())) throw new AppException(ErrorCode.PROVIDER_NOT_VERIFIED);
        return profile;
    }

    private ProviderProfileResponse profile(UUID id) {
        try {
            var profile = identity.getProviderProfile(id);
            if (profile == null || !id.equals(profile.getProviderProfileId()) || profile.getUserId() == null)
                throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
            return profile;
        } catch (FeignException ex) {
            throw new AppException(ex.status() == 404 ? ErrorCode.PROVIDER_NOT_ACTIVE : ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
    }

    private ApplicationDto dto(Application app) {
        return mapper.toDto(app, publicProfile(profile(app.getProviderId())),
                proposals.findByApplication_ApplicationId(app.getApplicationId()).stream().map(proposalMapper::toDto).toList());
    }

    private ProviderBasicDto publicProfile(ProviderProfileResponse p) {
        return new ProviderBasicDto(p.getProviderProfileId(), p.getBusinessName(), null, p.getRatingAvg(), p.getRatingCount());
    }

    static boolean constraint(Throwable ex, String name) {
        for (Throwable cause = ex; cause != null; cause = cause.getCause())
            if (cause instanceof org.hibernate.exception.ConstraintViolationException violation &&
                    violation.getConstraintName() != null && violation.getConstraintName().toLowerCase(Locale.ROOT).contains(name)) return true;
        return false;
    }
}
