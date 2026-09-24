package com.workgo.identity.repository;

import com.workgo.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    User findByUserName(String userName);

    boolean existsByUserName(@Param("userName") String userName);

    boolean existsByEmail(@Param("email") String email);

    Page<User> findAll(Pageable pageable);

}
