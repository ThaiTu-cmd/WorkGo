package com.workgo.trust.repository;

import com.workgo.trust.entity.TrustInboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface TrustInboxEventRepository extends JpaRepository<TrustInboxEvent, UUID> {
    Optional<TrustInboxEvent> findByEventId(String eventId);
}
