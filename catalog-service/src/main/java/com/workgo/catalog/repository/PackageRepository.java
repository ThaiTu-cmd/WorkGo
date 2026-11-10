package com.workgo.catalog.repository;

import com.workgo.catalog.entity.Package;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PackageRepository extends JpaRepository<Package, UUID> {
    Page<Package> findAllByService_ServiceId(UUID serviceId, Pageable pageable);

    boolean existsByService_ServiceIdAndName(UUID serviceId, String name);

}
