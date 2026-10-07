package com.workgo.catalog.repository;

import com.workgo.catalog.entity.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {

    boolean existsBySlug(String slug);

    Page<Service> findAllByProviderId(UUID providerId, Pageable pageable);

}
