package com.workgo.communication.service;

import com.workgo.communication.dto.response.PageResponse;
import com.workgo.communication.exception.AppException;
import com.workgo.communication.exception.ErrorCode;
import org.springframework.data.domain.*;
import java.util.List;

final class PageSupport {
    private PageSupport() {}

    static Pageable request(int page, int size, String sort, String field) {
        if (page < 0 || size < 1 || size > 100 || (sort != null && !sort.equals(field + ",desc"))) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, field, "id"));
    }

    static <T> PageResponse<T> response(Page<?> page, List<T> data) {
        return new PageResponse<>(page.getTotalPages(), page.getSize(), page.getTotalElements(), page.getNumber(), data);
    }
}
