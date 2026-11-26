package com.workgo.order.reppository;
import com.workgo.order.entity.ProviderAdmission;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ProviderAdmissionRepository extends JpaRepository<ProviderAdmission,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select a from ProviderAdmission a where a.providerId=:id")
    Optional<ProviderAdmission> lock(UUID id);
}
