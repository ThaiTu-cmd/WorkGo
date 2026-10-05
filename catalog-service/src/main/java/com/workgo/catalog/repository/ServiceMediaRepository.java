package com.workgo.catalog.repository;

import com.workgo.catalog.entity.ServiceMedia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServiceMediaRepository extends JpaRepository<ServiceMedia, UUID> {

    Page<ServiceMedia> findAllByService_ServiceId(UUID serviceId, Pageable pageable);

    boolean existsByService_ServiceIdAndUrl(UUID serviceId, String url);

}
