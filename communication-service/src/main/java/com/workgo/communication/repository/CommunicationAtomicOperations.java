package com.workgo.communication.repository;

import com.workgo.communication.entity.Conversation;
import com.workgo.communication.entity.Message;
import com.workgo.communication.entity.Notification;
import com.workgo.communication.enumeration.ConversationStatus;
import com.workgo.communication.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Repository
@RequiredArgsConstructor
public class CommunicationAtomicOperations {
    private final MongoTemplate mongo;
    private final CommunicationTransactions transactions;
    private final Clock clock;

    /**
     * Persists an already validated server-built message (including ID, sentAt and requestHash).
     * Replay lookup/payload comparison belongs to MessageService, outside a failed transaction.
     * Returns only after commit; callers may then publish best-effort realtime events.
     */
    public Message saveMessage(Message message) {
        Objects.requireNonNull(message.getSentAt(), "server sentAt");
        return transactions.execute(() -> {
            Conversation room = requireParticipant(message.getConversationId(), message.getSenderId());
            if (room.getStatus() != ConversationStatus.ACTIVE) {
                throw new AppException(ErrorCode.CONVERSATION_NOT_ACTIVE);
            }
            Query guard = Query.query(where("id").is(room.getId()).and("participants.userId").is(message.getSenderId())
                    .and("status").is(ConversationStatus.ACTIVE).and("version").is(room.getVersion()));
            Update summary = new Update().max("lastMessageAt", message.getSentAt())
                    .max("lastActivityAt", message.getSentAt()).inc("version", 1);
            if (mongo.updateFirst(guard, summary, Conversation.class).getModifiedCount() != 1) {
                throw new OptimisticLockingFailureException("Conversation changed during send");
            }
            return mongo.insert(message);
        });
    }

    /** Read exactly one incoming message, preserving the first timestamp on replay. */
    public Message markMessageRead(UUID actorId, UUID messageId) {
        Objects.requireNonNull(actorId, "actorId");
        Objects.requireNonNull(messageId, "messageId");
        return transactions.execute(() -> {
            Message message = mongo.findById(messageId, Message.class);
            if (message == null) throw new MessageNotFoundException();
            requireParticipant(message.getConversationId(), actorId);
            if (actorId.equals(message.getSenderId()) || message.getReadAt() != null) return message;

            Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
            Query unread = Query.query(where("id").is(messageId).and("conversationId").is(message.getConversationId())
                    .and("senderId").ne(actorId).and("readAt").is(null));
            Message updated = mongo.findAndModify(unread, Update.update("readAt", now),
                    FindAndModifyOptions.options().returnNew(true), Message.class);
            if (updated == null) throw new OptimisticLockingFailureException("Message changed during read");
            Query member = Query.query(where("id").is(message.getConversationId()).and("participants.userId").is(actorId));
            // This is read-interaction metadata, never an unread watermark.
            if (mongo.updateFirst(member, new Update().max("participants.$.lastReadAt", now).inc("version", 1),
                    Conversation.class).getMatchedCount() != 1) {
                throw new AppException(ErrorCode.NOT_CONVERSATION_PARTICIPANT);
            }
            return updated;
        });
    }

    /** Atomic per notification, idempotent as a batch; no snapshot/all-or-nothing guarantee. */
    public long markAllNotificationsRead(UUID recipientId) {
        Objects.requireNonNull(recipientId, "recipientId");
        Query unread = Query.query(where("recipientId").is(recipientId).and("readAt").is(null));
        return mongo.updateMulti(unread, Update.update("readAt", clock.instant().truncatedTo(ChronoUnit.MILLIS)),
                Notification.class).getModifiedCount();
    }

    private Conversation requireParticipant(UUID conversationId, UUID actorId) {
        Objects.requireNonNull(conversationId, "conversationId");
        Objects.requireNonNull(actorId, "actorId");
        Conversation room = mongo.findById(conversationId, Conversation.class);
        if (room == null) throw new ChatNotFoundException();
        if (room.getParticipants().stream().noneMatch(p -> actorId.equals(p.getUserId()))) {
            throw new AppException(ErrorCode.NOT_CONVERSATION_PARTICIPANT);
        }
        return room;
    }
}
