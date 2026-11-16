package com.workgo.catalog.repository;

import com.workgo.catalog.entity.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID>, JpaSpecificationExecutor<Service> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from Service s where s.serviceId = :serviceId")
    java.util.Optional<Service> findByIdForRatingUpdate(@org.springframework.data.repository.query.Param("serviceId") UUID serviceId);

    /** Rating columns are excluded from ordinary ORM writes; this is their sole update path. */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = """
            UPDATE services SET avg_rating = :average, review_count = :count,
                rating_aggregate_version = :version
            WHERE service_id = :serviceId AND is_deleted = 0 AND rating_aggregate_version < :version
            """, nativeQuery = true)
    int updateRatingSnapshot(@org.springframework.data.repository.query.Param("serviceId") UUID serviceId,
            @org.springframework.data.repository.query.Param("average") double average,
            @org.springframework.data.repository.query.Param("count") long count,
            @org.springframework.data.repository.query.Param("version") long version);

    boolean existsBySlug(String slug);

    Page<Service> findAllByProviderId(UUID providerId, Pageable pageable);

}
