package com.workgo.identity.repository;
import com.workgo.identity.entity.ProviderTrustEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ProviderTrustEventRepository extends JpaRepository<ProviderTrustEvent,UUID> {
    List<ProviderTrustEvent> findTop50ByDeliveredAtIsNullOrderByApprovedAtAsc();
}
