package com.workgo.identity.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.request.AuthenticationRequest;
import com.workgo.identity.dto.request.IntrospectRequest;
import com.workgo.identity.dto.request.LogoutRequest;
import com.workgo.identity.dto.response.AuthenticationResponse;
import com.workgo.identity.dto.response.IntrospectResponse;
import com.workgo.identity.entity.InvalidatedToken;
import com.workgo.identity.entity.User;
import com.workgo.identity.repository.InvalidatedTokenRepository;
import com.workgo.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuthenticationService {

    InvalidatedTokenRepository invalidatedTokenRepository;
    UserRepository userRepository;

    @NonFinal
    @Value("${jwt.signerKey}")
    String SIGNER_KEY;

    public AuthenticationResponse authenticate(AuthenticationRequest request) throws JOSEException {

        var user = userRepository.findByUserName(request.getUserName());
        if(user == null) throw new AppException(ErrorCode.USER_NOT_EXISTED);

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if(!authenticated) throw new AppException(ErrorCode.UNAUTHENTICATED);

        var token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(authenticated)
                .build();

    }

    public IntrospectResponse introspect(IntrospectRequest request){

        var token = request.getToken();
        boolean isValid = true;

        try{
            verifyToken(token);
        } catch (Exception e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public void logout(LogoutRequest request){
        try{
            var signToken = verifyToken(request.getToken());

            String jit = signToken.getJWTClaimsSet().getJWTID();

            Date expiredTime = signToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jit)
                    .expiryTime(expiredTime.toInstant())
                    .build();

            invalidatedTokenRepository.save(invalidatedToken);

        } catch (AppException e){
            log.info("Token already expired !");
        } catch (ParseException e) {
            throw new RuntimeException(e);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {

        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if(!verified || expiryTime.before(new Date())){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if(invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    private String generateToken(User user) throws JOSEException {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUserName())
                .issuer("workgoTeam.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(24, ChronoUnit.HOURS)
                                .toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try{
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        }catch (JOSEException e){
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }

    }

    private String buildScope(User user){
        StringJoiner stringJoiner = new StringJoiner(" ");

        if(!CollectionUtils.isEmpty(user.getUserRoles()))
            user.getUserRoles().forEach(userRole -> {
                stringJoiner.add("ROLE_" + userRole.getRole().getRoleName());
            });

        return stringJoiner.toString();
    }


}
