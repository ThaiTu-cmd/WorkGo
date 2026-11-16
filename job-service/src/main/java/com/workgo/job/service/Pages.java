package com.workgo.job.service;

import com.workgo.job.dto.response.PageResponse;
import com.workgo.job.exception.*;
import java.util.Set;
import org.springframework.data.domain.*;

public final class Pages {
    private Pages() { }

    public static Pageable request(int page, int size, String sort, Set<String> allowed) {
        String[] parts = sort.split(",", -1);
        if (parts.length > 2 || !allowed.contains(parts[0]) ||
                parts.length == 2 && !Set.of("asc", "desc").contains(parts[1]))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var direction = parts.length == 2 ? Sort.Direction.fromString(parts[1]) : Sort.Direction.DESC;
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, size)), Sort.by(direction, parts[0]));
    }

    public static <T> PageResponse<T> response(Page<T> page) {
        return new PageResponse<>(page.getTotalPages(), page.getSize(), page.getTotalElements(),
                page.getNumber(), page.getContent());
    }
}
