package com.workgo.order.reppository;

import com.workgo.order.entity.DigitalExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalExecutionRepository extends JpaRepository<DigitalExecution, UUID> {

    Optional<DigitalExecution> findByExecution_ExecutionId(UUID executionId);
}