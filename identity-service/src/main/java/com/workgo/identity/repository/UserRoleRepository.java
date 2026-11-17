package com.workgo.identity.repository;

import com.workgo.identity.entity.UserRole;
import com.workgo.identity.enumeration.RoleName;
import com.workgo.identity.enumeration.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    boolean existsByRole_RoleName(RoleName roleName);

    long countByRole_RoleNameAndUser_Status(RoleName roleName, UserStatus status);
}
