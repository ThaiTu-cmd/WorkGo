package com.workgo.order.reppository;
import com.workgo.order.entity.PreviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;
public interface PreviewSessionRepository extends JpaRepository<PreviewSession,UUID> {
    Optional<PreviewSession> findByOrderIdAndRequestKey(UUID orderId,UUID key);
    boolean existsByOrderIdAndActiveSlot(UUID orderId,Integer slot);
    List<PreviewSession> findByOrderIdOrderByCreatedAtAsc(UUID orderId);
    List<PreviewSession> findByActiveSlot(Integer slot,Pageable page);
    List<PreviewSession> findByStatus(String status,Pageable page);
    @Query("select p from PreviewSession p where p.activeSlot=1 and ((p.status='REQUESTED' and (p.responseDueAt<=:now or p.scheduleDueAt<=:now)) or (p.status='CONFIRMED' and p.scheduledAt<=:cutoff)) order by p.createdAt")
    List<PreviewSession> findDue(@Param("now") Instant now,@Param("cutoff") Instant cutoff,Pageable page);
}
