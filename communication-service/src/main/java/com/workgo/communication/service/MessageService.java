package com.workgo.communication.service;

import com.workgo.communication.dto.request.MessageSendReq;
import com.workgo.communication.dto.response.*;
import com.workgo.communication.entity.MediaAttachment;
import com.workgo.communication.entity.Message;
import com.workgo.communication.enumeration.ConversationStatus;
import com.workgo.communication.exception.*;
import com.workgo.communication.mapper.MessageMapper;
import com.workgo.communication.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.dao.*;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Import(AttachmentVerificationService.class)
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
    private final AttachmentVerificationService attachmentVerifier;
    @Value("${app.attachments.max-count-per-message:10}") private int maxCount = 10;
    @Value("${app.attachments.max-file-size-bytes:20971520}") private long maxFile = 20L * 1024 * 1024;
    @Value("${app.attachments.max-total-size-bytes:104857600}") private long maxTotal = 100L * 1024 * 1024;

    public MessageService(ConversationService conversations, MessageRepository messages,
                          CommunicationAtomicOperations operations, CommunicationTransactions transactions,
                          MessageMapper mapper, PayloadSupport payloads, RealtimePublisher realtime,
                          SendRateLimiter rateLimiter, Clock clock) {
        this(conversations, messages, operations, transactions, mapper, payloads, realtime, rateLimiter, clock,
                new AttachmentVerificationService(conversations));
    }

    @Autowired
    public MessageService(ConversationService conversations, MessageRepository messages,
                          CommunicationAtomicOperations operations, CommunicationTransactions transactions,
                          MessageMapper mapper, PayloadSupport payloads, RealtimePublisher realtime,
                          SendRateLimiter rateLimiter, Clock clock,
                          @Autowired(required = false) AttachmentVerificationService attachmentVerifier) {
        this.conversations = conversations;
        this.messages = messages;
        this.operations = operations;
        this.transactions = transactions;
        this.mapper = mapper;
        this.payloads = payloads;
        this.realtime = realtime;
        this.rateLimiter = rateLimiter;
        this.clock = clock;
        this.attachmentVerifier = attachmentVerifier != null ? attachmentVerifier : new AttachmentVerificationService(conversations);
    }

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
        List<MediaAttachment> verifiedAttachments = request.attachments().isEmpty()
                ? List.of()
                : attachmentVerifier.verifyAndResolve(actorId, conversationId, request.attachments(), maxCount, maxFile, maxTotal);
        var message = mapper.toEntity(request);
        message.setId(UUID.randomUUID()); message.setConversationId(conversationId); message.setSenderId(actorId);
        message.setRequestHash(hash); message.setSentAt(clock.instant().truncatedTo(ChronoUnit.MILLIS));
        message.setAttachments(verifiedAttachments); message.setReadAt(null);
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
