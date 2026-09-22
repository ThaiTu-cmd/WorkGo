package com.workgo.identity.util;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.entity.User;
import com.workgo.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.util.Optionals;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserUtil {

        UserRepository userRepository;

        public User getCurrentUser(){
            String userName = SecurityContextHolder.getContext().getAuthentication().getName();

            User user = userRepository.findByUserName(userName);

            if(user == null) throw new AppException(ErrorCode.USER_NOT_EXISTED);

            return user;
        }

}
