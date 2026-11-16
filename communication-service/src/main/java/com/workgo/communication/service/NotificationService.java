package com.workgo.communication.service;

import com.workgo.communication.dto.response.*;
import com.workgo.communication.entity.Notification;
import com.workgo.communication.exception.*;
import com.workgo.communication.mapper.NotificationMapper;
import com.workgo.communication.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.*;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notifications;
    private final CommunicationAtomicOperations operations;
    private final MongoTemplate mongo;
    private final NotificationMapper mapper;
    private final Clock clock;

    public PageResponse<NotificationDto> list(UUID actorId, boolean unreadOnly, int page, int size, String sort) {
        var paging = PageSupport.request(page, size, sort, "createdAt");
        var result = unreadOnly ? notifications.findByRecipientIdAndReadAtIsNull(actorId, paging)
                : notifications.findByRecipientId(actorId, paging);
        return PageSupport.response(result, result.stream().map(mapper::toDto).toList());
    }

    public NotificationDto markRead(UUID actorId, UUID notificationId) {
        var notification = notifications.findById(notificationId).orElseThrow(NotificationNotFoundException::new);
        if (!actorId.equals(notification.getRecipientId())) throw new AppException(ErrorCode.UNAUTHORIZED);
        if (notification.getReadAt() != null) return mapper.toDto(notification);
        var updated = mongo.findAndModify(Query.query(where("id").is(notificationId).and("recipientId").is(actorId).and("readAt").is(null)),
                Update.update("readAt", clock.instant().truncatedTo(ChronoUnit.MILLIS)),
                FindAndModifyOptions.options().returnNew(true), Notification.class);
        return mapper.toDto(updated != null ? updated : notifications.findById(notificationId).orElseThrow(NotificationNotFoundException::new));
    }

    public long readAll(UUID actorId) { return operations.markAllNotificationsRead(actorId); }
}
