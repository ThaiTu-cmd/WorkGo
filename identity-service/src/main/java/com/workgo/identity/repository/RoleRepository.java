package com.workgo.identity.repository;

import com.workgo.identity.entity.Role;
import com.workgo.identity.enumeration.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, RoleName> {

}
