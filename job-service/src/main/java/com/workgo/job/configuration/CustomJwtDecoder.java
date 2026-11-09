package com.workgo.job.configuration;

import com.nimbusds.jwt.SignedJWT;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.text.ParseException;

@Component
public class CustomJwtDecoder implements JwtDecoder {
    // Match catalog/order/payment: Gateway introspects the token; the service
    // parses its claims to build the authentication used for authorization.
    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            SignedJWT signedJwt = SignedJWT.parse(token);
            var claims = signedJwt.getJWTClaimsSet();
            if (claims.getIssueTime() == null || claims.getExpirationTime() == null) {
                throw new BadJwtException("Invalid Token");
            }
            return new Jwt(token, claims.getIssueTime().toInstant(), claims.getExpirationTime().toInstant(),
                    signedJwt.getHeader().toJSONObject(), claims.getClaims());
        } catch (ParseException | IllegalArgumentException exception) {
            throw new BadJwtException("Invalid Token", exception);
        }
    }
}
