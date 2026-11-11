package com.workgo.job.service;

import com.workgo.job.dto.response.AcceptedProposalResponse;
import com.workgo.job.exception.AppException;
import com.workgo.job.exception.ErrorCode;
import com.workgo.job.repository.ApplicationRepository;
import com.workgo.job.repository.JobRepository;
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
        return new AcceptedProposalResponse(proposal.getProposalId(), job.getJobId(), job.getClientId(),
                application.getProviderId(), job.getExecutionType().name(), proposal.getPrice(),
                proposal.getCurrency(), proposal.getEstimatedDays(), job.getTitle(), job.getDescription(),
                job.getLocationSnapshot(), proposal.getTerms(), proposal.getStatus().name(),
                job.getStatus().name(), application.getStatus().name());
    }
}
