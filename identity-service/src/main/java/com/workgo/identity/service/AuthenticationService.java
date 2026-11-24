package com.workgo.identity.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;
import com.workgo.identity.Exception.*;
import com.workgo.identity.dto.request.*;
import com.workgo.identity.dto.response.*;
import com.workgo.identity.entity.User;
import com.workgo.identity.enumeration.UserStatus;
import com.workgo.identity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class AuthenticationService {
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final UserRepository userRepository;
    private final RefreshSessionService refreshSessions;
    private final Clock clock;
    @Value("${jwt.signerKey}") private String SIGNER_KEY;

    @Transactional(rollbackFor = Exception.class)
    public AuthenticationResponse authenticate(AuthenticationRequest request) throws JOSEException {
        String identifier = request.getUserName() == null ? "" : request.getUserName().trim();
        if (identifier.isEmpty()) throw new AppException(ErrorCode.USERNAME_INVALID);
        User user = userRepository.findByIdentifierIgnoreCase(identifier)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        if (request.getPassword() == null || user.getStatus() != UserStatus.ACTIVE
                || !new BCryptPasswordEncoder(10).matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return response(refreshSessions.start(user));
    }

    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            String scope = verifyToken(request.getToken(), true).getJWTClaimsSet().getStringClaim("scope");
            return IntrospectResponse.builder().valid(true).scope(scope).build();
        } catch (AppException | JOSEException | ParseException | IllegalArgumentException e) {
            return IntrospectResponse.builder().valid(false).build();
        }
        // Storage/dependency errors propagate as server errors, never as a false invalid-token ACK.
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshSessions.revoke(request.getRefreshToken());
        if (request.getToken() == null || request.getToken().isBlank()) return;
        try {
            // Signed expired access can revoke its family; authorization is never granted here.
            var claims = verifyToken(request.getToken(), false).getJWTClaimsSet();
            refreshSessions.revokeFamily(UUID.fromString(claims.getStringClaim("sessionId")), UUID.fromString(claims.getStringClaim("userId")));
        } catch (AppException | JOSEException | ParseException | IllegalArgumentException ignored) {
            // Logout is idempotent for already revoked or malformed credentials.
        }
    }

    // Commit replay revocation before returning 401. Other failures roll back issuance.
    @Transactional(noRollbackFor = AppException.class, rollbackFor = JOSEException.class)
    public AuthenticationResponse refreshToken(RefreshRequest request) throws JOSEException {
        return response(refreshSessions.rotate(request.getRefreshToken(), request.getRequestId()));
    }

    private SignedJWT verifyToken(String token, boolean requireActive) throws JOSEException, ParseException {
        if (token == null || token.isBlank()) throw invalid();
        SignedJWT jwt = SignedJWT.parse(token);
        JWTClaimsSet claims = jwt.getJWTClaimsSet();
        if (!JWSAlgorithm.HS512.equals(jwt.getHeader().getAlgorithm())
                || !jwt.verify(new MACVerifier(SIGNER_KEY.getBytes(StandardCharsets.UTF_8)))
                || !"workgoTeam.com".equals(claims.getIssuer()) || claims.getExpirationTime() == null
                || claims.getStringClaim("sessionId") == null || claims.getStringClaim("userId") == null) throw invalid();
        if (!requireActive) return jwt;
        if (!clock.instant().isBefore(claims.getExpirationTime().toInstant())
                || invalidatedTokenRepository.existsById(claims.getJWTID())) throw invalid();
        User user = userRepository.findByUserName(claims.getSubject());
        if (user == null || user.getStatus() != UserStatus.ACTIVE
                || !Objects.equals(claims.getLongClaim("authorizationVersion"), user.getAuthorizationVersion())
                || !user.getUserId().toString().equals(claims.getStringClaim("userId"))
                || !refreshSessions.active(UUID.fromString(claims.getStringClaim("sessionId")), user.getUserId())) throw invalid();
        return jwt;
    }

    private AuthenticationResponse response(RefreshSessionService.Grant grant) throws JOSEException {
        User user = grant.user();
        Instant now = clock.instant();
        Instant expires = now.plusSeconds(900);
        StringJoiner scope = new StringJoiner(" ");
        user.getUserRoles().forEach(role -> scope.add("ROLE_" + role.getRole().getRoleName()));
        var claims = new JWTClaimsSet.Builder().subject(user.getUserName()).issuer("workgoTeam.com")
                .issueTime(Date.from(now)).expirationTime(Date.from(expires)).jwtID(UUID.randomUUID().toString())
                .claim("scope", scope.toString()).claim("userId", user.getUserId().toString())
                .claim("providerId", user.getProviderProfile() == null ? null : user.getProviderProfile().getProviderProfileId().toString())
                .claim("authorizationVersion", user.getAuthorizationVersion()).claim("authTime", grant.session().getAuthTime())
                .claim("sessionId", grant.session().getFamilyId().toString()).build();
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS512), claims);
        jwt.sign(new MACSigner(SIGNER_KEY.getBytes(StandardCharsets.UTF_8)));
        return AuthenticationResponse.builder().token(jwt.serialize()).authenticated(true).expiresAt(expires)
                .refreshToken(grant.refreshToken()).build();
    }
    private static AppException invalid() { return new AppException(ErrorCode.UNAUTHENTICATED); }
}
