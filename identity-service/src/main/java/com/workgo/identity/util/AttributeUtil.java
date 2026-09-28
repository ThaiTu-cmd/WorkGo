package com.workgo.identity.util;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.entity.User;
import com.workgo.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class Util {

        UserRepository userRepository;

        public User getCurrentUser(){
            String userName = SecurityContextHolder.getContext().getAuthentication().getName();

            User user = userRepository.findByUserName(userName);

            if(user == null) throw new AppException(ErrorCode.USER_NOT_EXISTED);

            return user;
        }

        public int createDeletedMark(){

            int mark = Instant.now().getNano() * 1000;

            return mark;

        }

}
