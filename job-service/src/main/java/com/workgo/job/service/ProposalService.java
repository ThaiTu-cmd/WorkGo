package com.workgo.job.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.job.dto.request.*;
import com.workgo.job.dto.response.*;
import com.workgo.job.entity.*;
import com.workgo.job.enumeration.*;
import com.workgo.job.exception.*;
import com.workgo.job.mapper.ProposalMapper;
import com.workgo.job.repository.*;
import com.workgo.job.utils.TokenUtils;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProposalService {
    private final ProposalRepository proposals;
    private final ApplicationRepository applications;
    private final ProposalOrderOutboxRepository outbox;
    private final ApplicationService applicationService;
    private final ProposalMapper mapper;
    private final ObjectMapper json;
    private final JobAccess access;
    private final TokenUtils token;
    @Value("${app.proposals.accept-enabled:false}") private boolean acceptEnabled;

    @Transactional
    public ProposalDto submit(UUID applicationId, ProposalSubmitReq req) {
        access.role("ROLE_PROVIDER");
        UUID jobId = applications.findJobId(applicationId).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        Job job = access.lock(jobId);
        Application app = applications.findLockedById(applicationId).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        if (!app.getProviderId().equals(token.getCurrentProviderId())) throw new AccessDeniedException("Application owner required");
        access.open(job);
        pendingApplication(app);
        var profile = applicationService.eligible(app.getProviderId());
        if (!profile.getUserId().equals(token.getCurrentUserId()) || profile.getUserId().equals(job.getClientId()))
            throw new AccessDeniedException("Profile identity mismatch");
        Instant now = Instant.now();
        if (req.expiresAt() != null && (!req.expiresAt().isAfter(now) || job.getDeadlineAt() != null && req.expiresAt().isAfter(job.getDeadlineAt())))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        for (Proposal previous : proposals.findByApplication_ApplicationId(applicationId)) {
            if (previous.getStatus() == ProposalStatus.ACCEPTED) throw new AppException(ErrorCode.APPLICATION_NOT_VALID);
            if (previous.getStatus() == ProposalStatus.PENDING) {
                if (previous.getExpiresAt() == null || previous.getExpiresAt().isAfter(now)) throw new AppException(ErrorCode.PROPOSAL_ALREADY_PENDING);
                previous.setStatus(ProposalStatus.EXPIRED);
            }
        }
        // Release the unique pending slot via entity callbacks before inserting a new version.
        proposals.flush();
        Proposal proposal = mapper.toEntity(req);
        proposal.setJob(job);
        proposal.setApplication(app);
        proposal.setCurrency(job.getCurrency());
        if (proposal.getExpiresAt() == null) proposal.setExpiresAt(job.getDeadlineAt());
        try { proposals.saveAndFlush(proposal); }
        catch (DataIntegrityViolationException ex) {
            if (ApplicationService.constraint(ex, "uq_proposal_pending")) throw new AppException(ErrorCode.PROPOSAL_ALREADY_PENDING);
            throw ex;
        }
        return mapper.toDto(proposal);
    }

    @Transactional
    public ProposalAcceptanceDto accept(UUID id) {
        Locked source = lock(id);
        access.owner(source.job());
        if (!acceptEnabled) throw new AppException(ErrorCode.ACCEPTANCE_DISABLED);
        Proposal p = source.proposal();
        if (p.getStatus() == ProposalStatus.ACCEPTED) return acceptance(p);
        pendingProposal(p);
        access.open(source.job());
        pendingApplication(source.app());
        if (p.getExpiresAt() != null && !p.getExpiresAt().isAfter(Instant.now())) throw new AppException(ErrorCode.PROPOSAL_EXPIRED);
        if (source.job().getExecutionType() != ExecutionType.DIGITAL) throw new AppException(ErrorCode.UNSUPPORTED_EXECUTION_TYPE);
        var profile = applicationService.eligible(source.app().getProviderId());
        if (profile.getUserId().equals(source.job().getClientId())) throw new AppException(ErrorCode.CANNOT_APPLY_OWN_JOB);
        p.setStatus(ProposalStatus.ACCEPTED);
        source.app().setStatus(ApplicationStatus.ACCEPTED);
        source.job().setStatus(JobStatus.CLOSED);
        // Preserve terminal historical versions and withdrawn applications; only reject active competitors.
        for (Proposal other : proposals.findByJob_JobId(source.job().getJobId()))
            if (!id.equals(other.getProposalId()) && other.getStatus() == ProposalStatus.PENDING) other.setStatus(ProposalStatus.REJECTED);
        for (Application other : applications.findAllByJob_JobId(source.job().getJobId()))
            if (!source.app().getApplicationId().equals(other.getApplicationId()) && other.getStatus() == ApplicationStatus.PENDING)
                other.setStatus(ApplicationStatus.REJECTED);
        ProposalOrderOutbox event = new ProposalOrderOutbox();
        event.setProposalId(id);
        try { event.setPayload(json.writeValueAsString(orderRequest(p))); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Cannot serialize proposal order", ex); }
        outbox.saveAndFlush(event);
        return acceptance(p);
    }

    @Transactional
    public ProposalDto reject(UUID id) {
        Locked source = lock(id);
        access.owner(source.job());
        access.open(source.job());
        pendingApplication(source.app());
        pendingProposal(source.proposal());
        if (source.proposal().getExpiresAt() != null && !source.proposal().getExpiresAt().isAfter(Instant.now()))
            throw new AppException(ErrorCode.PROPOSAL_EXPIRED);
        source.proposal().setStatus(ProposalStatus.REJECTED);
        proposals.flush();
        return mapper.toDto(source.proposal());
    }

    public PageResponse<ProposalDto> forJob(UUID id, int page, int size, String sort) {
        access.owner(access.read(id));
        return Pages.response(proposals.findByJob_JobId(id, Pages.request(page, size, sort, Set.of("createdAt", "price", "status"))).map(mapper::toDto));
    }

    public ProposalAcceptanceDto orderSync(UUID id) {
        var ids = proposals.findSourceIds(id).orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));
        access.owner(access.read(ids.getJobId()));
        return acceptance(proposals.findById(id).orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND)));
    }

    @Transactional
    public ProposalAcceptanceDto retryOrder(UUID id) {
        Locked source = lock(id);
        access.owner(source.job());
        if (!acceptEnabled) throw new AppException(ErrorCode.ACCEPTANCE_DISABLED);
        var event = outbox.findLockedById(id).orElseThrow(() -> new AppException(ErrorCode.INVALID_STATUS_TRANSITION));
        if (event.getStatus() != OrderSyncStatus.FAILED) throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        event.setStatus(OrderSyncStatus.RETRY);
        event.setAttempts(0);
        event.setLastError(null);
        event.setNextAttemptAt(Instant.now());
        event.setUpdatedAt(Instant.now());
        return acceptance(source.proposal());
    }

    private ProposalAcceptanceDto acceptance(Proposal p) {
        var event = outbox.findById(p.getProposalId()).orElseThrow(() -> new AppException(ErrorCode.INVALID_STATUS_TRANSITION));
        return new ProposalAcceptanceDto(mapper.toDto(p), event.getStatus(), event.getOrderId());
    }

    private Locked lock(UUID id) {
        var ids = proposals.findSourceIds(id).orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));
        Job job = access.lock(ids.getJobId());
        Application app = applications.findLockedById(ids.getApplicationId()).orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        Proposal proposal = proposals.findLockedById(id).orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));
        return new Locked(job, app, proposal);
    }

    private void pendingApplication(Application app) {
        if (app.getStatus() != ApplicationStatus.PENDING) throw new AppException(ErrorCode.APPLICATION_NOT_VALID);
    }
    private void pendingProposal(Proposal p) {
        if (p.getStatus() != ProposalStatus.PENDING) throw new AppException(ErrorCode.PROPOSAL_NOT_PENDING);
    }
    private record Locked(Job job, Application app, Proposal proposal) { }

    public CreateProposalOrderRequest orderRequest(Proposal p) {
        Job j = p.getJob();
        return new CreateProposalOrderRequest(p.getProposalId(), j.getJobId(), j.getClientId(), p.getApplication().getProviderId(),
                j.getExecutionType().name(), p.getPrice(), p.getCurrency(), p.getEstimatedDays(), j.getTitle(),
                j.getDescription(), j.getLocationSnapshot(), p.getTerms());
    }
}
