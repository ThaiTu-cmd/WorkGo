package com.workgo.catalog.repository;

import com.workgo.catalog.entity.AddOn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AddOnRepository extends JpaRepository<AddOn, UUID> {

    boolean existsByService_ServiceId(UUID serviceId);

    Page<AddOn> findAllByService_ServiceId(UUID serviceId, Pageable pageable);

}
