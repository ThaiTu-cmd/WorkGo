package com.workgo.trust.service;

import com.workgo.trust.dto.response.PageResponse;
import com.workgo.trust.exception.*;
import org.springframework.data.domain.*;
import java.net.URI;
import java.util.*;

final class TrustSupport {
    private TrustSupport() {}
    static Pageable page(int page, int size, String id) {
        if (page < 0 || size < 1 || size > 100) throw new AppException(ErrorCode.INVALID_REQUEST);
        return PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc(id)));
    }
    static <T> PageResponse<T> response(Page<T> page) {
        return new PageResponse<>(page.getTotalPages(), page.getSize(), page.getTotalElements(), page.getNumber(), page.getContent());
    }
    static void evidence(String value) {
        if (value == null) return;
        try {
            var uri = new URI(value);
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    || uri.getHost() == null || uri.getRawUserInfo() != null) throw new IllegalArgumentException();
        } catch (Exception e) { throw new AppException(ErrorCode.INVALID_REQUEST); }
    }
    static boolean participant(UUID client, UUID provider, UUID user, UUID currentProvider) {
        return client.equals(user) || provider.equals(currentProvider);
    }
}
