package com.workgo.job.repository;

import com.workgo.job.entity.Proposal;
import com.workgo.job.enumeration.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProposalRepository extends JpaRepository<Proposal, UUID> {
    // Read FK values before materializing the composite Application association. A hidden parent
    // must produce a controlled 404, rather than a Hibernate proxy resolution exception.
    @Query("SELECT p.job.jobId AS jobId, p.application.applicationId AS applicationId FROM Proposal p "
            + "WHERE p.proposalId = :proposalId")
    Optional<SourceIds> findSourceIds(@Param("proposalId") UUID proposalId);

    interface SourceIds {
        UUID getJobId();
        UUID getApplicationId();
    }

    List<Proposal> findByJob_JobId(UUID jobId);

    Page<Proposal> findByJob_JobId(UUID jobId, Pageable pageable);

    List<Proposal> findByApplication_ApplicationId(UUID applicationId);

    List<Proposal> findAllByJob_JobIdAndStatus(UUID jobId, ProposalStatus status);
}
