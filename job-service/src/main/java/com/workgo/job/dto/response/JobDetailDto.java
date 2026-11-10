package com.workgo.job.dto.response;

import com.workgo.job.enumeration.ExecutionType;
import com.workgo.job.enumeration.JobStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record JobDetailDto(UUID jobId, UUID clientId, UUID categoryId, String title, String description,
                           BigDecimal budgetMin, BigDecimal budgetMax, String currency,
                           ExecutionType executionType, String locationSnapshot, Instant deadlineAt,
                           JobStatus status, Instant createdAt, Instant updatedAt,
                           List<JobAttachmentDto> attachments, ClientBasicDto client) {
}
