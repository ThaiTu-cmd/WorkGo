package com.workgo.job.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.job.dto.request.CreateProposalOrderRequest;
import com.workgo.job.dto.response.AcceptedProposalResponse;
import com.workgo.job.exception.AppException;
import com.workgo.job.exception.ErrorCode;
import com.workgo.job.repository.ApplicationRepository;
import com.workgo.job.repository.JobRepository;
import com.workgo.job.repository.ProposalOrderOutboxRepository;
import com.workgo.job.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProposalSnapshotService {
    private final ProposalRepository proposals;
    private final JobRepository jobs;
    private final ApplicationRepository applications;
    private final ProposalOrderOutboxRepository outbox;
    private final ObjectMapper json;

    @Transactional(readOnly = true)
    public AcceptedProposalResponse getSnapshot(UUID proposalId) {
        var ids = proposals.findSourceIds(proposalId)
                .orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));
        var job = jobs.findById(ids.getJobId())
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        var application = applications.findById(ids.getApplicationId())
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
        var proposal = proposals.findById(proposalId)
                .orElseThrow(() -> new AppException(ErrorCode.PROPOSAL_NOT_FOUND));
        var frozenOutbox = outbox.findById(proposalId).orElse(null);
        if (frozenOutbox != null && frozenOutbox.getPayload() != null && !frozenOutbox.getPayload().isBlank()) {
            try {
                CreateProposalOrderRequest frozen = json.readValue(frozenOutbox.getPayload(), CreateProposalOrderRequest.class);
                return new AcceptedProposalResponse(
                        frozen.proposalId(), frozen.jobId(), frozen.clientId(), frozen.providerId(),
                        frozen.executionType(), frozen.price(), frozen.currency(), frozen.estimatedDays(),
                        frozen.jobTitle(), frozen.jobDescription(), frozen.locationSnapshot(), frozen.terms(),
                        proposal.getStatus().name(), job.getStatus().name(), application.getStatus().name(),frozen.rewardQuoteRef(),frozen.acceptedAt());
            } catch (Exception corrupted) {
                throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            }
        }
        return new AcceptedProposalResponse(proposal.getProposalId(), job.getJobId(), job.getClientId(),
                application.getProviderId(), job.getExecutionType().name(), proposal.getPrice(),
                proposal.getCurrency(), proposal.getEstimatedDays(), job.getTitle(), job.getDescription(),
                job.getLocationSnapshot(), proposal.getTerms(), proposal.getStatus().name(),
                job.getStatus().name(), application.getStatus().name(),proposal.getRewardQuoteRef(),proposal.getAcceptedAt());
    }
}
