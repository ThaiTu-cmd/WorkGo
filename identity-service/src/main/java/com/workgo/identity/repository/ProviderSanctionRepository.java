package com.workgo.identity.repository;
import com.workgo.identity.entity.ProviderSanction;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.Instant;
public interface ProviderSanctionRepository extends JpaRepository<ProviderSanction,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from ProviderSanction s where s.id=:id")
    Optional<ProviderSanction> lock(UUID id);
    List<ProviderSanction> findByProviderIdOrderByEffectiveAtDesc(UUID providerId);
    @Query("select count(s) from ProviderSanction s where s.userId=:user and s.scope in :scopes and s.revokedAt is null and s.effectiveAt<=:now and (s.expiresAt is null or s.expiresAt>:now)")
    long active(UUID user,Collection<String> scopes,Instant now);
    @Query("select coalesce(sum(s.version+1),0) from ProviderSanction s where s.providerId=:provider")
    long revision(UUID provider);
}
