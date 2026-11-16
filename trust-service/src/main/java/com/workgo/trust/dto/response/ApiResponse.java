package com.workgo.trust.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(int code, String message, T result) {
    public static class ApiResponseBuilder<T> {
        private int code = 1000;
    }
}
