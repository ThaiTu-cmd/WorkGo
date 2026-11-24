package com.workgo.identity.service;

import com.workgo.identity.Exception.*;
import com.workgo.identity.entity.*;
import com.workgo.identity.enumeration.UserStatus;
import com.workgo.identity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY, noRollbackFor = AppException.class)
public class RefreshSessionService {
    private final RefreshSessionRepository sessions;
    private final UserRepository users;
    private final Clock clock;
    private static final SecureRandom RANDOM = new SecureRandom();

    public record Grant(User user, RefreshSession session, String refreshToken) {}

    public Grant start(User authenticated) {
        User user = users.lockActiveById(authenticated.getUserId()).orElseThrow(RefreshSessionService::invalid);
        if (!Objects.equals(user.getAuthorizationVersion(), authenticated.getAuthorizationVersion())) throw invalid();
        return issue(user, UUID.randomUUID(), clock.instant().plus(Duration.ofDays(7)), clock.instant().getEpochSecond());
    }

    public Grant rotate(String credential, String requestId) {
        if (requestId == null || requestId.isBlank() || requestId.length() > 128) throw invalid();
        String hash = hash(credential);
        UUID userId = sessions.userIdForHash(hash).orElseThrow(RefreshSessionService::invalid);
        User user = users.lockActiveById(userId).orElse(null);
        RefreshSession old = sessions.findById(hash).orElseThrow(RefreshSessionService::invalid);
        if (old.isRevoked() || old.getRotatedTo() != null || !clock.instant().isBefore(old.getExpiresAt())
                || user == null || user.getStatus() != UserStatus.ACTIVE
                || !Objects.equals(old.getAuthVersion(), user.getAuthorizationVersion())) {
            sessions.revokeFamily(old.getFamilyId());
            throw invalid();
        }
        Grant next = issue(user, old.getFamilyId(), old.getExpiresAt(), old.getAuthTime());
        old.setRotatedTo(next.session().getTokenHash());
        sessions.save(old);
        return next;
    }

    public void revoke(String credential) {
        if (credential == null || credential.isBlank()) return;
        String hash = hash(credential);
        var id = sessions.userIdForHash(hash);
        if (id.isEmpty()) return;
        users.lockActiveById(id.get());
        sessions.findById(hash).ifPresent(session -> sessions.revokeFamily(session.getFamilyId()));
    }

    public void revokeFamily(UUID familyId, UUID userId) {
        users.lockActiveById(userId);
        sessions.revokeFamily(familyId);
    }

    @Transactional(readOnly = true, propagation = Propagation.SUPPORTS)
    public boolean active(UUID family, UUID user) {
        return sessions.existsByFamilyIdAndUserIdAndRevokedFalseAndExpiresAtAfter(family, user, clock.instant());
    }

    private Grant issue(User user, UUID family, Instant expiry, Long authTime) {
        byte[] bytes = new byte[32]; RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshSession session = RefreshSession.builder().tokenHash(hash(token)).familyId(family).userId(user.getUserId())
                .expiresAt(expiry).authTime(authTime).authVersion(user.getAuthorizationVersion()).build();
        sessions.save(session);
        return new Grant(user, session, token);
    }

    private static String hash(String token) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) throw invalid();
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII))); }
        catch (NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }
    private static AppException invalid() { return new AppException(ErrorCode.UNAUTHENTICATED); }
}
