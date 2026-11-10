package com.workgo.job.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.workgo.job.enumeration.JobStatus;
import jakarta.validation.constraints.*;

/** Null fields leave existing content unchanged. Status transitions are validated by the service. */
public record JobUpdateReq(
        JobStatus status,
        @Pattern(regexp = "(?s).*\\S.*", message = "INVALID_REQUEST")
        @Size(max = 255, message = "INVALID_REQUEST") String title,
        String description) {

    @JsonIgnore
    @AssertTrue(message = "INVALID_REQUEST")
    public boolean isStatusAllowed() {
        return status == null || status == JobStatus.OPEN || status == JobStatus.PAUSED || status == JobStatus.CLOSED;
    }
}
