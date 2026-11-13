package com.workgo.catalog.repository;

import com.workgo.catalog.entity.AvailableRule;
import com.workgo.catalog.enumeration.RuleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AvailableRuleRepository extends JpaRepository<AvailableRule, UUID> {

    boolean existsByService_ServiceId(UUID serviceId);

    Page<AvailableRule> findAllByService_ServiceId(UUID serviceId, Pageable pageable);

    List<AvailableRule> findAllByService_ServiceId(UUID serviceId);

    List<AvailableRule> findAllByStatus(RuleStatus status);

}
