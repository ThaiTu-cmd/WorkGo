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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${app.bootstrap.enabled:false}")
    boolean bootstrapEnabled;

    @NonFinal
    @Value("${app.bootstrap.user-name:}")
    String bootstrapUserName;

    @NonFinal
    @Value("${app.bootstrap.password:}")
    String bootstrapPassword;

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
            initRole(roleRepository, RoleName.SUPER_ADMIN);

            bootstrapSuperAdmin(userRepository, roleRepository, userRoleRepository);
        };

    }

    private void bootstrapSuperAdmin(UserRepository userRepository,
                                RoleRepository roleRepository,
                                UserRoleRepository userRoleRepository){
        if(!bootstrapEnabled) return;

        if(bootstrapUserName.isBlank() || bootstrapPassword.length() < 8){
            log.warn("Bootstrap super admin skipped: user name or password is missing");
            return;
        }

        if(userRoleRepository.existsByRole_RoleName(RoleName.SUPER_ADMIN)
                || userRepository.existsAnyStatusByUserName(bootstrapUserName)){
            log.info("Bootstrap super admin skipped: super admin account already exists");
            return;
        }

        User user = userRepository.save(User.builder()
                .firstName("")
                .lastName(bootstrapUserName)
                .userName(bootstrapUserName)
                .password(passwordEncoder.encode(bootstrapPassword))
                .status(UserStatus.ACTIVE)
                .build());

        Role role = roleRepository.findById(RoleName.SUPER_ADMIN)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        userRoleRepository.save(UserRole.builder()
                .grantedAt(Instant.now())
                .userNameHost("System")
                .user(user)
                .role(role)
                .build());

        log.info("Bootstrap super admin created: {}", bootstrapUserName);
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
