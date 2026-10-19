package com.workgo.catalog.repository;

import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.ExecutionType;
import com.workgo.catalog.enumeration.ServiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {

    boolean existsBySlug(String slug);

    Page<Service> findAllByProviderId(UUID providerId, Pageable pageable);

    Page<Service> findAllByStatusAndCategory_CategoryIdAndExecutionTypeAndBasePriceBetween(
            ServiceStatus status,
            UUID categoryId,
            ExecutionType executionType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    );
}
