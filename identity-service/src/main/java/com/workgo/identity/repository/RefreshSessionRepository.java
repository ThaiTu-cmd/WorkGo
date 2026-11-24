package com.workgo.identity.repository;

import com.workgo.identity.entity.RefreshSession;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface RefreshSessionRepository extends JpaRepository<RefreshSession, String> {
    // Scalar lookup before taking the user lock avoids a stale managed token row.
    @Query("select s.userId from RefreshSession s where s.tokenHash=:hash")
    Optional<UUID> userIdForHash(@Param("hash") String hash);
    @Modifying
    @Query("update RefreshSession s set s.revoked=true where s.familyId=:family")
    int revokeFamily(@Param("family") UUID family);
    boolean existsByFamilyIdAndUserIdAndRevokedFalseAndExpiresAtAfter(UUID family, UUID user, Instant now);
}
