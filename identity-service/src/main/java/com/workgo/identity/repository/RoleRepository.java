package com.workgo.identity.repository;

import com.workgo.identity.entity.Role;
import com.workgo.identity.enumeration.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, RoleName> {

    // Create role definitions only when an actual user is assigned the role.
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "INSERT INTO roles (role_name) VALUES (:name) ON CONFLICT (role_name) DO NOTHING", nativeQuery = true)
    void insertIfAbsent(@org.springframework.data.repository.query.Param("name") String name);

    default Role getOrCreate(RoleName name) {
        insertIfAbsent(name.name());
        return findById(name).orElseThrow();
    }

    // Serialize account administration before reading actors, targets or the last-admin count.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from Role r where r.roleName = :name")
    java.util.Optional<Role> lockByName(@org.springframework.data.repository.query.Param("name") RoleName name);

}
