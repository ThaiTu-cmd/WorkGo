package com.workgo.order.configuration;

import com.nimbusds.jwt.SignedJWT;
import com.workgo.order.dto.request.IntrospectRequest;
import com.workgo.order.dto.response.client.IntrospectResponse;
import com.workgo.order.reppository.client.IdentityClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.text.ParseException;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CustomJwtDecoder implements JwtDecoder {

    IdentityClient identityClient;

    @Override
    public Jwt decode(String token) throws JwtException {

        IntrospectResponse introspect;
        try {
            var response = identityClient.introspect(new IntrospectRequest(token));
            if (response == null || response.getCode() != 1000 || response.getResult() == null) {
                throw new IdentityUnavailableException();
            }
            introspect = response.getResult();
        } catch (FeignException e) {
            throw new IdentityUnavailableException(e);
        }

        if (introspect == null || !introspect.isValid()) {
            throw new BadJwtException("Token Invalid !");
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            var claims = signedJWT.getJWTClaimsSet();
            if (claims.getIssueTime() == null || claims.getExpirationTime() == null
                    || !claims.getExpirationTime().toInstant().isAfter(java.time.Instant.now())
                    || claims.getIssueTime().after(claims.getExpirationTime())) throw new BadJwtException("Invalid Token");

            return new Jwt(token,
                    signedJWT.getJWTClaimsSet().getIssueTime().toInstant(),
                    signedJWT.getJWTClaimsSet().getExpirationTime().toInstant(),
                    signedJWT.getHeader().toJSONObject(),
                    signedJWT.getJWTClaimsSet().getClaims()
            );
        } catch (ParseException | IllegalArgumentException e) {
            throw new BadJwtException("Invalid Token");
        }
    }
}
