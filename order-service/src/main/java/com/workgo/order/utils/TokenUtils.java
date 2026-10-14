package com.workgo.order.utils;


import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class TokenUtils {

    //lay providerId tu token
    public UUID getCurrentProviderId() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        String providerId = jwt.getClaimAsString("providerId");

        if(providerId == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        return UUID.fromString(providerId);
    }

    public UUID getCurrentUserId(){
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        String userId = jwt.getClaimAsString("userId");

        if(userId == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        return UUID.fromString(userId);

    }

    public int createDeletedMark(){

        int mark = Instant.now().getNano() * 1000;

        return mark;

    }

}
