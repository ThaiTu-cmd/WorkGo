package com.workgo.communication.service;

import com.workgo.communication.dto.request.ConversationCreateReq;
import com.workgo.communication.dto.response.*;
import com.workgo.communication.entity.*;
import com.workgo.communication.enumeration.*;
import com.workgo.communication.exception.*;
import com.workgo.communication.mapper.ConversationMapper;
import com.workgo.communication.repository.*;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.dao.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversations;
    private final MongoTemplate mongo;
    private final ConversationMapper mapper;
    private final CommunicationTransactions transactions;
    private final PayloadSupport payloads;
    private final Clock clock;
    @org.springframework.beans.factory.annotation.Autowired private ConversationContextVerifier contexts;

    public PageResponse<ConversationDto> list(UUID actorId, int page, int size, String sort) {
        var result = conversations.findByParticipants_UserId(actorId, PageSupport.request(page, size, sort, "lastActivityAt"));
        // Revalidate scoped rooms before exposing their metadata or unread counts.
        result.forEach(room -> verifyContext(room, actorId));
        Map<UUID, Long> unread = new HashMap<>();
        if (!result.isEmpty()) {
            var query = Aggregation.newAggregation(Message.class,
                    Aggregation.match(where("conversationId").in(result.stream().map(Conversation::getId).toList())
                            .and("senderId").ne(actorId).and("readAt").is(null)),
                    Aggregation.group("conversationId").count().as("count"));
            mongo.aggregate(query, Document.class).forEach(row -> unread.put(
                    UUID.fromString(row.getString("_id")), ((Number) row.get("count")).longValue()));
        }
        return PageSupport.response(result, result.stream().map(room -> mapper.toDto(room, unread.getOrDefault(room.getId(), 0L))).toList());
    }

    public ConversationDto create(UUID actorId, ConversationCreateReq request) {
        if (request != null && request.contextType() != null && !request.isContextValid())
            throw new AppException(ErrorCode.INVALID_CONVERSATION_CONTEXT);
        payloads.validate(request);
        if (actorId.equals(request.participantId())) throw new AppException(ErrorCode.CANNOT_CHAT_WITH_SELF);
        if (request.conversationType() != ConversationType.DIRECT_MESSAGE) throw new AppException(ErrorCode.INVALID_REQUEST);
        ContextType context = normalize(request.contextType());
        if (context != ContextType.GENERAL) {
            if(contexts==null)throw new DataAccessResourceFailureException("Conversation context verification unavailable");
            var verified=contexts.verify(context,request.contextId(),List.of(actorId,request.participantId()),actorId);
            if(terminal(verified.lifecycle()))throw new AppException(ErrorCode.CONVERSATION_NOT_ACTIVE);
        }
        String key = directKey(actorId, request.participantId(), context, request.contextId());
        var existing = conversations.findByDirectKeyAndConversationType(key, ConversationType.DIRECT_MESSAGE);
        if (existing.isPresent()) return toDto(existing.get(), actorId);
        var now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        var room = Conversation.builder().id(UUID.randomUUID()).contextType(context).contextId(request.contextId())
                .directKey(key).createdAt(now).lastActivityAt(now)
                .participants(List.of(new ConversationParticipant(actorId, now, null),
                        new ConversationParticipant(request.participantId(), now, null))).build();
        try { return toDto(transactions.execute(() -> conversations.insert(room)), actorId); }
        catch (DuplicateKeyException duplicate) {
            return toDto(ReplayLookup.winner(transactions,
                    () -> conversations.findByDirectKeyAndConversationType(key, ConversationType.DIRECT_MESSAGE)), actorId);
        }
    }

    public Conversation requireParticipant(UUID actorId, UUID id) {
        var room = conversations.findById(id).orElseThrow(ChatNotFoundException::new);
        if (room.getParticipants().stream().noneMatch(p -> actorId.equals(p.getUserId())))
            throw new AppException(ErrorCode.NOT_CONVERSATION_PARTICIPANT);
        verifyContext(room, actorId);
        return room;
    }

    private void verifyContext(Conversation room, UUID actorId) {
        if (normalize(room.getContextType()) == ContextType.GENERAL) return;
        if (contexts == null) throw new DataAccessResourceFailureException("Context owner unavailable");
        var verified=contexts.verify(room.getContextType(), room.getContextId(),
                room.getParticipants().stream().map(ConversationParticipant::getUserId).toList(), actorId);
        if(terminal(verified.lifecycle()))room.setStatus(ConversationStatus.CLOSED);
    }

    private boolean terminal(String lifecycle){return Set.of("COMPLETED","CANCELLED","CLOSED","REJECTED","RESOLVED_CLIENT","RESOLVED_PROVIDER").contains(lifecycle);}

    private ConversationDto toDto(Conversation room, UUID actor) {
        long unread = mongo.count(org.springframework.data.mongodb.core.query.Query.query(where("conversationId").is(room.getId())
                .and("senderId").ne(actor).and("readAt").is(null)), Message.class);
        return mapper.toDto(room, unread);
    }

    public static String directKey(UUID a, UUID b, ContextType type, UUID contextId) {
        var users = new ArrayList<>(List.of(a.toString(), b.toString()));
        Collections.sort(users);
        return users.getFirst() + ":" + users.getLast() + ":" + normalize(type) + ":" + (contextId == null ? "null" : contextId);
    }

    private static ContextType normalize(ContextType type) { return type == null ? ContextType.GENERAL : type == ContextType.JOB ? ContextType.POST : type; }
}
