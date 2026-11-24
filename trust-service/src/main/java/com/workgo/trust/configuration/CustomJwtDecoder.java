package com.workgo.trust.configuration;

import com.nimbusds.jwt.SignedJWT;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.text.ParseException;

@Component
@lombok.RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {
    private final IdentityTokenIntrospector introspector;
    @Override
    public Jwt decode(String token) throws JwtException {
        if (!introspector.verify(token)) throw new BadJwtException("Invalid Token");
        try {
            SignedJWT signedJwt = SignedJWT.parse(token);
            var claims = signedJwt.getJWTClaimsSet();
            if (claims.getIssueTime() == null || claims.getExpirationTime() == null
                    || !claims.getExpirationTime().toInstant().isAfter(java.time.Instant.now())
                    || claims.getIssueTime().after(claims.getExpirationTime())) {
                throw new BadJwtException("Invalid Token");
            }
            return new Jwt(token, claims.getIssueTime().toInstant(), claims.getExpirationTime().toInstant(),
                    signedJwt.getHeader().toJSONObject(), claims.getClaims());
        } catch (ParseException | IllegalArgumentException exception) {
            throw new BadJwtException("Invalid Token", exception);
        }
    }
}
