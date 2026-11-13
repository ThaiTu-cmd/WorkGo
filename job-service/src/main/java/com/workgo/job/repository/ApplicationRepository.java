package com.workgo.job.repository;

import com.workgo.job.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    long countByJob_JobId(UUID jobId);

    java.util.List<Application> findAllByJob_JobId(UUID jobId);

    @Query("select a.job.jobId from Application a where a.applicationId = :id")
    java.util.Optional<UUID> findJobId(@Param("id") UUID id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Application a where a.applicationId = :id")
    java.util.Optional<Application> findLockedById(@Param("id") UUID id);
    // Deliberately bypass SQLRestriction: uniqueness includes soft-deleted applications.
    @Query(value = "SELECT EXISTS (SELECT 1 FROM applications WHERE job_id = :jobId AND provider_id = :providerId)",
            nativeQuery = true)
    boolean existsByJob_JobIdAndProviderId(@Param("jobId") UUID jobId, @Param("providerId") UUID providerId);

    Page<Application> findByJob_JobId(UUID jobId, Pageable pageable);

    Page<Application> findByProviderId(UUID providerId, Pageable pageable);
}
