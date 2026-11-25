package com.workgo.trust.repository;

import com.workgo.trust.entity.OnsiteIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnsiteIncidentRepository extends JpaRepository<OnsiteIncident, UUID> {
    Optional<OnsiteIncident> findByOrderId(UUID orderId);
}
