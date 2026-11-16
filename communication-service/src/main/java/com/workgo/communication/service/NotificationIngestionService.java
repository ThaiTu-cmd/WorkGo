package com.workgo.communication.service;

import com.workgo.communication.dto.request.InternalNotificationCreateReq;
import com.workgo.communication.dto.response.NotificationDto;
import com.workgo.communication.entity.InboxEvent;
import com.workgo.communication.exception.*;
import com.workgo.communication.mapper.NotificationMapper;
import com.workgo.communication.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.*;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NotificationIngestionService {
    private final NotificationRepository notifications;
    private final InboxEventRepository inbox;
    private final CommunicationTransactions transactions;
    private final NotificationMapper mapper;
    private final PayloadSupport payloads;
    private final RealtimePublisher realtime;
    private final Clock clock;

    public record IngestionResult(NotificationDto notification, boolean created) {}

    public IngestionResult ingest(InternalNotificationCreateReq request) {
        payloads.validate(request);
        if ((request.referenceType() == null) != (request.referenceId() == null)) throw new AppException(ErrorCode.INVALID_REQUEST);
        var canonical = new InternalNotificationCreateReq(request.eventId().strip(), request.recipientId(),
                request.type().strip(), request.title().strip(), request.content(), request.referenceType(), request.referenceId());
        var fields = Arrays.asList(canonical.recipientId(), canonical.type(), canonical.title(), canonical.content(),
                canonical.referenceType(), canonical.referenceId());
        String hash = payloads.hash(fields);
        var existing = inbox.findByEventId(canonical.eventId());
        if (existing.isPresent()) return replay(existing.get(), hash);
        var now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        var notification = mapper.toEntity(canonical);
        notification.setId(UUID.randomUUID()); notification.setCreatedAt(now); notification.setReadAt(null);
        var event = InboxEvent.builder().id(UUID.randomUUID()).eventId(canonical.eventId()).notificationId(notification.getId())
                .eventType(canonical.type()).payload(payloads.serialize(fields)).payloadHash(hash).receivedAt(now).processedAt(now).build();
        NotificationDto dto;
        try {
            dto = transactions.execute(() -> {
                var saved = notifications.insert(notification);
                inbox.insert(event);
                return mapper.toDto(saved);
            });
        } catch (DuplicateKeyException duplicate) {
            return replay(ReplayLookup.winner(transactions, () -> inbox.findByEventId(canonical.eventId())), hash);
        }
        realtime.notification(dto);
        return new IngestionResult(dto, true);
    }

    private IngestionResult replay(InboxEvent event, String hash) {
        if (!hash.equals(event.getPayloadHash())) throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);
        if (event.getProcessedAt() == null) throw new DataAccessResourceFailureException("Incomplete notification ingestion");
        var notification = notifications.findById(event.getNotificationId())
                .orElseThrow(() -> new DataAccessResourceFailureException("Committed notification unavailable"));
        return new IngestionResult(mapper.toDto(notification), false);
    }
}
