package com.workgo.trust.repository;

import com.workgo.trust.entity.OnsiteProgressNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OnsiteProgressNoticeRepository extends JpaRepository<OnsiteProgressNotice, UUID> {
    List<OnsiteProgressNotice> findByOrderIdOrderByOccurredAtAsc(UUID orderId);
}
