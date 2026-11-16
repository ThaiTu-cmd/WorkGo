package com.workgo.communication.service;

import com.workgo.communication.exception.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.util.*;

/** Bounded, per-user fixed windows for the initially supported single service instance. */
@Component
public class SendRateLimiter {
    private final Clock clock;
    private final int maxRequests;
    private final long windowMillis;
    private final int maxUsers;
    private final Map<UUID, Window> users = new HashMap<>();

    public SendRateLimiter(Clock clock,
            @Value("${app.http.send-rate-limit.max-requests:60}") int maxRequests,
            @Value("${app.http.send-rate-limit.window-millis:60000}") long windowMillis,
            @Value("${app.http.send-rate-limit.max-users:10000}") int maxUsers) {
        if (maxRequests < 1 || windowMillis < 1 || maxUsers < 1) throw new IllegalArgumentException("Invalid send rate limits");
        this.clock = clock; this.maxRequests = maxRequests; this.windowMillis = windowMillis; this.maxUsers = maxUsers;
    }

    public synchronized void acquire(UUID actorId) {
        long now = clock.millis();
        Window current = users.get(actorId);
        if (current != null && now - current.startedAt < windowMillis) {
            if (current.count >= maxRequests) throw new AppException(ErrorCode.SEND_RATE_LIMITED);
            current.count++;
            return;
        }
        if (current == null && users.size() >= maxUsers) {
            users.values().removeIf(window -> now - window.startedAt >= windowMillis);
            if (users.size() >= maxUsers) throw new DataAccessResourceFailureException("Send limiter capacity reached");
        }
        users.put(actorId, new Window(now));
    }

    private static final class Window {
        final long startedAt;
        int count = 1;
        Window(long startedAt) { this.startedAt = startedAt; }
    }
}
