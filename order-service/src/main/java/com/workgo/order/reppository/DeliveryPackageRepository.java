package com.workgo.order.reppository;

import com.workgo.order.entity.DeliveryPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryPackageRepository extends JpaRepository<DeliveryPackage, UUID> {

    long countByExecution_ExecutionId(UUID executionId);

    List<DeliveryPackage> findByExecution_ExecutionIdOrderByVersionNoDesc(UUID executionId);

    Optional<DeliveryPackage> findFirstByExecution_ExecutionIdOrderByVersionNoDesc(UUID executionId);

}
