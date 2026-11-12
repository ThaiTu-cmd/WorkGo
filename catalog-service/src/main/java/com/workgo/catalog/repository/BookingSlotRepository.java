package com.workgo.catalog.repository;

import com.workgo.catalog.entity.BookingSlot;
import com.workgo.catalog.enumeration.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingSlotRepository extends JpaRepository<BookingSlot, UUID> {

    Page<BookingSlot> findAllByService_ServiceIdAndStartedAtBetween(UUID serviceId, Instant from, Instant to, Pageable pageable);

    List<BookingSlot> findAllByService_ServiceIdAndStartedAtBetween(UUID serviceId, Instant from, Instant to);

    void deleteAllByAvailableRuleIdAndStatusAndStartedAtAfter(UUID availableRuleId, BookingStatus status, Instant startedAt);

}
