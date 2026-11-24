package com.workgo.trust.repository;
import com.workgo.trust.entity.ReputationLedgerEntry;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import java.util.*;
public interface ReputationLedgerRepository extends JpaRepository<ReputationLedgerEntry,UUID>{
    Optional<ReputationLedgerEntry> findByProviderIdAndSourceKey(UUID provider,String source);
    List<ReputationLedgerEntry> findByDecisionIdAndKind(UUID decision,String kind);
    @Query("select coalesce(sum(e.requestedDelta),0) from ReputationLedgerEntry e where e.providerId=:provider and e.orderId=:order and e.kind in ('PENALTY','CORRECTION')")
    long penalties(UUID provider,UUID order);
    Page<ReputationLedgerEntry> findByProviderId(UUID provider,Pageable pageable);
    @Query("select coalesce(sum(e.requestedDelta),0) from ReputationLedgerEntry e where e.providerId=:provider and e.kind='REWARD' and (:client is null or e.clientId=:client) and e.createdAt>=:since")
    long rewards(UUID provider,UUID client,java.time.Instant since);
}
