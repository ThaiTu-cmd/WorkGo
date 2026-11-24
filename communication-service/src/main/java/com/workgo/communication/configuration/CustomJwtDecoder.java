package com.workgo.communication.configuration;

import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.time.Clock;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {
    private final Clock clock;
    private final IdentityTokenIntrospector introspector;
    @Override
    public Jwt decode(String token) {
        if (!introspector.verify(token)) throw new BadJwtException("Invalid token");
        try {
            var signed = SignedJWT.parse(token);
            var claims = signed.getJWTClaimsSet();
            if (claims.getIssueTime() == null || claims.getExpirationTime() == null
                    || !claims.getExpirationTime().toInstant().isAfter(clock.instant())
                    || claims.getIssueTime().after(claims.getExpirationTime())) {
                throw new BadJwtException("Invalid token lifetime");
            }
            String userId = claims.getStringClaim("userId");
            if (userId == null || !UUID.fromString(userId).toString().equalsIgnoreCase(userId)) {
                throw new BadJwtException("Invalid user identity");
            }
            return new Jwt(token, claims.getIssueTime().toInstant(), claims.getExpirationTime().toInstant(),
                    signed.getHeader().toJSONObject(), claims.getClaims());
        } catch (ParseException | IllegalArgumentException exception) {
            throw new BadJwtException("Invalid token", exception);
        }
    }
}
