package com.workgo.job.repository;

import com.workgo.job.entity.JobAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobAttachmentRepository extends JpaRepository<JobAttachment, UUID> {
    List<JobAttachment> findByJob_JobId(UUID jobId);
}
