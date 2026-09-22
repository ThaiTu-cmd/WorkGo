package com.workgo.identity.repository;

import com.workgo.identity.dto.response.AddressResponse;
import com.workgo.identity.entity.Address;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    Page<Address> findAllByUserId(UUID userId, Pageable pageable);
}
