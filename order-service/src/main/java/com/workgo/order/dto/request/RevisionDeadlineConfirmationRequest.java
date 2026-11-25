package com.workgo.order.dto.request;
import java.time.Instant;
public record RevisionDeadlineConfirmationRequest(Instant proposedRepairDeadline) {}
