package com.workgo.communication.service;

import com.workgo.communication.dto.request.MessageSendReq;
import com.workgo.communication.dto.response.*;
import com.workgo.communication.entity.Message;
import com.workgo.communication.enumeration.ConversationStatus;
import com.workgo.communication.exception.*;
import com.workgo.communication.mapper.MessageMapper;
import com.workgo.communication.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final ConversationService conversations;
    private final MessageRepository messages;
    private final CommunicationAtomicOperations operations;
    private final CommunicationTransactions transactions;
    private final MessageMapper mapper;
    private final PayloadSupport payloads;
    private final RealtimePublisher realtime;
    private final SendRateLimiter rateLimiter;
    private final Clock clock;
    @Value("${app.attachments.max-count-per-message:10}") private int maxCount;
    @Value("${app.attachments.max-file-size-bytes:20971520}") private long maxFile;
    @Value("${app.attachments.max-total-size-bytes:104857600}") private long maxTotal;

    public PageResponse<MessageDto> list(UUID actorId, UUID conversationId, int page, int size, String sort) {
        var paging = PageSupport.request(page, size, sort, "sentAt");
        conversations.requireParticipant(actorId, conversationId);
        var result = messages.findByConversationId(conversationId, paging);
        return PageSupport.response(result, result.stream().map(mapper::toDto).toList());
    }

    public MessageDto send(UUID actorId, UUID conversationId, MessageSendReq request) {
        var room = conversations.requireParticipant(actorId, conversationId);
        rateLimiter.acquire(actorId);
        payloads.validateMessage(request, maxCount, maxFile, maxTotal);
        // Server fields, clientMessageId and conversation identity do not belong in the payload hash.
        String hash = payloads.hash(Arrays.asList(request.content(), request.messageType(), request.attachments()));
        var existing = messages.findByConversationIdAndSenderIdAndClientMessageId(conversationId, actorId, request.clientMessageId());
        if (existing.isPresent()) return replay(existing.get(), hash);
        if (room.getStatus() != ConversationStatus.ACTIVE) throw new AppException(ErrorCode.CONVERSATION_NOT_ACTIVE);
        // No trusted storage contract/allowlist/ownership lookup exists. Never persist client metadata as verified.
        if (!request.attachments().isEmpty()) throw new DataAccessResourceFailureException("Attachment verification unavailable");
        var message = mapper.toEntity(request);
        message.setId(UUID.randomUUID()); message.setConversationId(conversationId); message.setSenderId(actorId);
        message.setRequestHash(hash); message.setSentAt(clock.instant().truncatedTo(ChronoUnit.MILLIS));
        message.setAttachments(List.of()); message.setReadAt(null);
        Message saved;
        try { saved = operations.saveMessage(message); }
        catch (DuplicateKeyException duplicate) {
            conversations.requireParticipant(actorId, conversationId);
            return replay(ReplayLookup.winner(transactions, () -> messages.findByConversationIdAndSenderIdAndClientMessageId(
                    conversationId, actorId, request.clientMessageId())), hash);
        } catch (AppException failure) {
            if (failure.getErrorCode() != ErrorCode.CONVERSATION_NOT_ACTIVE) throw failure;
            // A same-key winner may have committed between the initial lookup and a close/retry.
            // The failed send transaction has ended; read committed data without reopening the room.
            conversations.requireParticipant(actorId, conversationId);
            var winner = transactions.execute(() -> messages.findByConversationIdAndSenderIdAndClientMessageId(
                    conversationId, actorId, request.clientMessageId()));
            if (winner.isPresent()) return replay(winner.get(), hash);
            throw failure;
        }
        var dto = mapper.toDto(saved);
        realtime.message(dto);
        return dto;
    }

    public MessageDto markRead(UUID actorId, UUID messageId) { return mapper.toDto(operations.markMessageRead(actorId, messageId)); }

    private MessageDto replay(Message message, String hash) {
        if (!hash.equals(message.getRequestHash())) throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);
        return mapper.toDto(message);
    }
}
