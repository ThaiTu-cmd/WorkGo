package com.workgo.job.repository;

import com.workgo.job.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    // Deliberately bypass SQLRestriction: uniqueness includes soft-deleted applications.
    @Query(value = "SELECT EXISTS (SELECT 1 FROM applications WHERE job_id = :jobId AND provider_id = :providerId)",
            nativeQuery = true)
    boolean existsByJob_JobIdAndProviderId(@Param("jobId") UUID jobId, @Param("providerId") UUID providerId);

    Page<Application> findByJob_JobId(UUID jobId, Pageable pageable);

    Page<Application> findByProviderId(UUID providerId, Pageable pageable);
}
