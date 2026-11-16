package com.workgo.communication.configuration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executor;

@Component
public class WebSocketSessionRegistry {
    private static final CloseStatus REJECTED = new CloseStatus(1008, "Session authorization ended");
    private final Map<String, State> sessions = new HashMap<>();
    private final WebSocketProperties properties;
    private final Clock clock;
    private final IdentityTokenIntrospector introspector;
    private final Executor validator;

    public WebSocketSessionRegistry(WebSocketProperties properties, Clock clock,
            IdentityTokenIntrospector introspector, @Qualifier("webSocketValidationExecutor") Executor validator) {
        this.properties = properties;
        this.clock = clock;
        this.introspector = introspector;
        this.validator = validator;
    }

    private static final class State {
        final WebSocketSession socket;
        final Instant opened;
        final Map<String, String> subscriptions = new HashMap<>();
        JwtAuthenticationToken authentication;
        Instant nextValidation;
        Instant validationStarted;
        boolean validating;
        State(WebSocketSession socket, Instant opened) { this.socket = socket; this.opened = opened; }
    }

    public synchronized boolean hasCapacity() {
        return sessions.size() < properties.getMaxSessions() && sessions.values().stream()
                .filter(state -> state.authentication == null).count() < properties.getMaxPendingHandshakes();
    }

    public synchronized boolean open(WebSocketSession socket) {
        if (!hasCapacity()) return false;
        sessions.put(socket.getId(), new State(socket, clock.instant()));
        return true;
    }

    public synchronized void authenticate(String id, JwtAuthenticationToken authentication) {
        State state = sessions.get(id);
        if (state == null || state.authentication != null
                || !clock.instant().isBefore(state.opened.plusMillis(properties.getConnectTimeoutMs()))
                || !clock.instant().isBefore(authentication.getToken().getExpiresAt())) {
            throw new AccessDeniedException("CONNECT rejected");
        }
        state.authentication = authentication;
        state.nextValidation = clock.instant().plusMillis(properties.getRevalidateIntervalMs());
    }

    public synchronized JwtAuthenticationToken authentication(String id) {
        State state = sessions.get(id);
        if (state == null || state.authentication == null
                || !clock.instant().isBefore(state.authentication.getToken().getExpiresAt())) {
            throw new AccessDeniedException("Authenticated CONNECT required");
        }
        return state.authentication;
    }

    public synchronized void subscribe(String id, String subscriptionId, String destination) {
        State state = sessions.get(id);
        if (state == null || subscriptionId == null || subscriptionId.isBlank()
                || state.subscriptions.containsKey(subscriptionId)
                || state.subscriptions.size() >= properties.getMaxSubscriptions()) {
            throw new AccessDeniedException("Subscription limit or invalid identifier");
        }
        state.subscriptions.put(subscriptionId, destination);
    }

    public synchronized void unsubscribe(String id, String subscriptionId) {
        State state = sessions.get(id);
        if (state != null) state.subscriptions.remove(subscriptionId);
    }

    public synchronized void remove(String id) { sessions.remove(id); }

    public void close(String id) {
        State state;
        synchronized (this) { state = sessions.remove(id); }
        if (state != null) {
            try { state.socket.close(REJECTED); } catch (IOException ignored) { /* already disconnected */ }
        }
    }

    @Scheduled(fixedDelayString = "${app.websocket.maintenance-interval-ms:1000}")
    public void maintain() {
        Map<String, State> snapshot;
        synchronized (this) { snapshot = new HashMap<>(sessions); }
        Instant now = clock.instant();
        snapshot.forEach((id, state) -> {
            String token = null;
            boolean expired;
            synchronized (this) {
                if (sessions.get(id) != state) return;
                expired = state.authentication == null
                        ? !now.isBefore(state.opened.plusMillis(properties.getConnectTimeoutMs()))
                        : !now.isBefore(state.authentication.getToken().getExpiresAt());
                expired |= state.validating && !now.isBefore(state.validationStarted.plusMillis(properties.getValidationTimeoutMs()));
                if (!expired && state.authentication != null && !state.validating && !now.isBefore(state.nextValidation)) {
                    state.validating = true;
                    state.validationStarted = now;
                    state.nextValidation = now.plusMillis(properties.getRevalidateIntervalMs());
                    token = state.authentication.getToken().getTokenValue();
                }
            }
            if (expired) { close(id); return; }
            if (token != null) {
                String credential = token;
                try {
                    validator.execute(() -> {
                        boolean valid = introspector.isValid(credential);
                        if (!valid) close(id);
                        synchronized (this) {
                            state.validating = false;
                        }
                    });
                } catch (RuntimeException rejected) { close(id); }
            }
        });
    }
}
