package com.workgo.identity.repository;

import com.workgo.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    User findByUserName(String userName);

    @Query("SELECT u FROM User u WHERE (LOWER(TRIM(u.userName)) = LOWER(TRIM(:identifier)) OR LOWER(TRIM(u.email)) = LOWER(TRIM(:identifier))) AND u.status = com.workgo.identity.enumeration.UserStatus.ACTIVE")
    Optional<User> findByIdentifierIgnoreCase(@Param("identifier") String identifier);

    boolean existsByUserName(@Param("userName") String userName);

    boolean existsByUserNameIgnoreCase(String userName);

    boolean existsByEmail(@Param("email") String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    Page<User> findAll(Pageable pageable);

}
