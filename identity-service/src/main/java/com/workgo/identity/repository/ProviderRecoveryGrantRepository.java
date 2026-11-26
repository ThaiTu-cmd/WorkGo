package com.workgo.identity.repository;
import com.workgo.identity.entity.ProviderRecoveryGrant;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface ProviderRecoveryGrantRepository extends JpaRepository<ProviderRecoveryGrant,UUID>{Optional<ProviderRecoveryGrant> findTopByProviderIdOrderByApprovedAtDesc(UUID provider);}
