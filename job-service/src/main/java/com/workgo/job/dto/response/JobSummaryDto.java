package com.workgo.job.dto.response;

import com.workgo.job.enumeration.ExecutionType;
import com.workgo.job.enumeration.JobStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record JobSummaryDto(UUID jobId, UUID clientId, UUID categoryId, String title,
                            BigDecimal budgetMin, BigDecimal budgetMax, String currency,
                            ExecutionType executionType, JobStatus status, Instant deadlineAt,
                            Instant createdAt, long applicationCount) {
}
