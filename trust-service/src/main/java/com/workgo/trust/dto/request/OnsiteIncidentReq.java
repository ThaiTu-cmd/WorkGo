package com.workgo.trust.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record OnsiteIncidentReq(
        @NotNull(message = "INVALID_REQUEST") UUID orderId,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 100, message = "INVALID_REQUEST") String incidentType,
        @Size(max = 50, message = "INVALID_REQUEST") String allegedFaultParty,
        Instant incidentAt,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 2000, message = "INVALID_REQUEST") String description,
        @Size(max = 1000, message = "INVALID_REQUEST") String evidenceUrl,
        @Size(max = 500, message = "INVALID_REQUEST") String locationSignal,
        Boolean forceMajeure
) {}
