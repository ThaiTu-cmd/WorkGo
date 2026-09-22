package com.workgo.identity.configuration;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.entity.Role;
import com.workgo.identity.entity.User;
import com.workgo.identity.entity.UserRole;
import com.workgo.identity.enumeration.RoleName;
import com.workgo.identity.enumeration.UserStatus;
import com.workgo.identity.repository.RoleRepository;
import com.workgo.identity.repository.UserRepository;
import com.workgo.identity.repository.UserRoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.HashSet;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @NonFinal
    String ADMIN_USER_NAME = "admin";

    @NonFinal
    String ADMIN_PASSWORD = "admin";

    @Bean
//    @ConditionalOnProperty(
//            prefix = "spring",
//            value = "datasource.driverClassName",
//            havingValue = "org.postgresql.Driver"
//    )
    ApplicationRunner applicationRunner(UserRepository userRepository,
                                        RoleRepository roleRepository,
                                        UserRoleRepository userRoleRepository){
        log.info("Initializing application ...");

        return args -> {
            initRole(roleRepository, RoleName.ADMIN);
            initRole(roleRepository, RoleName.CLIENT);
            initRole(roleRepository, RoleName.PROVIDER);

            if(userRepository.findByUserName(ADMIN_USER_NAME) == null){

                String hashedPassword = passwordEncoder.encode(ADMIN_PASSWORD);

                User user = User.builder()
                        .firstName("")
                        .lastName("admin")
                        .userName(ADMIN_USER_NAME)
                        .password(hashedPassword)
                        .status(UserStatus.ACTIVE)
                        .build();

                userRepository.save(user);

                Role role = roleRepository.findById(RoleName.ADMIN)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

                UserRole userRole = UserRole.builder()
                        .grantedAt(Instant.now())
                        .userNameHost("System")
                        .user(user)
                        .role(role)
                        .build();

                HashSet<UserRole> userRoles = new HashSet<>();
                userRoles.add(userRole);

                userRoleRepository.save(userRole);

                user.setUserRoles(userRoles);
                userRepository.save(user);

                log.info("ADMIN info : " + user);

            }


        };

    }

    private void initRole(RoleRepository roleRepository, RoleName roleName){
        if(!roleRepository.existsById(roleName)){
            roleRepository.save(Role.builder()
                            .roleName(roleName)
                    .build());
            log.info("init successful " + roleName.toString());
        }
        else{
            log.info("Nothing to do");
        }

    }

}
