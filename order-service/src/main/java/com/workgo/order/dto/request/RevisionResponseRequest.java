package com.workgo.order.dto.request;
import java.time.Instant;
public record RevisionResponseRequest(String response, Instant proposedRepairDeadline) {}
