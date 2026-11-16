package com.workgo.catalog.repository;

import com.workgo.catalog.entity.BookingSlot;
import com.workgo.catalog.enumeration.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingSlotRepository extends JpaRepository<BookingSlot, UUID> {

    Page<BookingSlot> findAllByService_ServiceIdAndStartedAtBetween(UUID serviceId, Instant from, Instant to, Pageable pageable);

    List<BookingSlot> findAllByService_ServiceIdAndStartedAtBetween(UUID serviceId, Instant from, Instant to);

    void deleteAllByAvailableRuleIdAndStatusAndStartedAtAfter(UUID availableRuleId, BookingStatus status, Instant startedAt);

    void deleteAllByService_ServiceIdAndStatusAndStartedAtAfter(UUID serviceId, BookingStatus status, Instant startedAt);

    // Row lock for hold/confirm/release: two orders racing for one slot are serialised,
    // so the second one sees it HELD and is refused.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from BookingSlot b where b.bookingSlotId = :id")
    Optional<BookingSlot> findByIdForUpdate(@Param("id") UUID id);

}
