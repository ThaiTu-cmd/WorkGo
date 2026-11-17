package com.workgo.trust.dto.response;

import lombok.Builder;
import java.util.List;

@Builder
public record PageResponse<T>(int totalPages, int pageSize, long totalElements,
                              int currentPage, List<T> data) {
}
