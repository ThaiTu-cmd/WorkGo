package com.workgo.order.reppository;
import com.workgo.order.entity.MeetAuthorization;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface MeetAuthorizationRepository extends JpaRepository<MeetAuthorization,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from MeetAuthorization a where a.userId=:id")
    Optional<MeetAuthorization> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
}
