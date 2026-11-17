package com.workgo.catalog.configuration;

import com.nimbusds.jwt.SignedJWT;
import com.workgo.catalog.dto.request.IntrospectRequest;
import com.workgo.catalog.dto.response.IntrospectResponse;
import com.workgo.catalog.repository.httpclient.IdentityClient;
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
            introspect = identityClient.introspect(new IntrospectRequest(token)).getResult();
        } catch (FeignException e) {
            throw new JwtException("Cannot verify token with identity-service");
        }

        if (introspect == null || !introspect.isValid()) {
            throw new BadJwtException("Token Invalid !");
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            return new Jwt(token,
                    signedJWT.getJWTClaimsSet().getIssueTime().toInstant(),
                    signedJWT.getJWTClaimsSet().getExpirationTime().toInstant(),
                    signedJWT.getHeader().toJSONObject(),
                    signedJWT.getJWTClaimsSet().getClaims()
            );
        } catch (ParseException e) {
            throw new BadJwtException("Invalid Token");
        }
    }
}
