package com.workgo.catalog.utils;

import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class TokenUtils {

    //lay providerId tu token
    public UUID getCurrentProviderId() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        String providerId = jwt.getClaimAsString("providerId");

        if(providerId == null) throw new AppException(ErrorCode.UNAUTHORIZED);

        return UUID.fromString(providerId);
    }

    public int createDeletedMark(){

        int mark = Instant.now().getNano() * 1000;

        return mark;

    }

}
