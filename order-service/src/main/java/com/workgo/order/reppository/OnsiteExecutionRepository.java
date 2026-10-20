package com.workgo.order.reppository;

import com.workgo.order.entity.OnsiteExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnsiteExecutionRepository extends JpaRepository<OnsiteExecution, UUID> {

    Optional<OnsiteExecution> findByExecution_ExecutionId(UUID executionId);
}