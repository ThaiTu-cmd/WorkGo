package com.workgo.identity.repository;
import com.workgo.identity.entity.SanctionAppeal;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface SanctionAppealRepository extends JpaRepository<SanctionAppeal,UUID> {
    java.util.List<SanctionAppeal> findByUserIdOrderBySubmittedAtDesc(UUID user);
    java.util.List<SanctionAppeal> findTop100ByStatusOrderBySubmittedAtAsc(String status);
    Optional<SanctionAppeal> findBySanctionIdAndUserId(UUID sanctionId,UUID userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select a from SanctionAppeal a where a.id=:id") Optional<SanctionAppeal> lock(UUID id);
}
