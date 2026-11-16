package com.workgo.trust.service;

import com.workgo.trust.dto.response.client.InternalOrderTrustSnapshot;
import com.workgo.trust.exception.*;
import com.workgo.trust.repository.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.UUID;

@Component @RequiredArgsConstructor
public class TrustOrderAccess {
    private final OrderClient client;
    public InternalOrderTrustSnapshot snapshot(UUID id) {
        try {
            var order = client.getOrderSnapshot(id);
            if (order == null || !id.equals(order.orderId()) || order.clientId() == null || order.providerId() == null
                    || order.orderStatus() == null) throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
            return order;
        } catch (TrustClientException e) {
            throw new AppException(e.getHttpStatus() == 404 ? ErrorCode.ORDER_NOT_FOUND : ErrorCode.DEPENDENCY_UNAVAILABLE);
        } catch (feign.FeignException e) { throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE); }
    }
    public boolean isClient(InternalOrderTrustSnapshot order, UUID user, UUID provider, ErrorCode selfError) {
        boolean c = order.clientId().equals(user), p = order.providerId().equals(provider);
        if (c && p) throw new AppException(selfError);
        if (!c && !p) throw new AppException(ErrorCode.NOT_ORDER_PARTICIPANT);
        return c;
    }
    public Instant expires(InternalOrderTrustSnapshot order, int days) {
        if (order.completedAt() == null || order.completedAt().isAfter(Instant.now()))
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        return order.completedAt().plus(Duration.ofDays(days));
    }
}
