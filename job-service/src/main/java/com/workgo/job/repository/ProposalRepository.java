package com.workgo.job.repository;

import com.workgo.job.entity.Proposal;
import com.workgo.job.enumeration.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProposalRepository extends JpaRepository<Proposal, UUID> {
    List<Proposal> findByJob_JobId(UUID jobId);

    Page<Proposal> findByJob_JobId(UUID jobId, Pageable pageable);

    List<Proposal> findByApplication_ApplicationId(UUID applicationId);

    List<Proposal> findAllByJob_JobIdAndStatus(UUID jobId, ProposalStatus status);
}
