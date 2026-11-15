package com.workgo.communication.repository;

import com.workgo.communication.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends MongoRepository<Message, UUID> {
    Page<Message> findByConversationId(UUID conversationId, Pageable pageable);

    long countByConversationIdAndSenderIdNotAndReadAtIsNull(UUID conversationId, UUID currentUserId);

    Optional<Message> findByConversationIdAndSenderIdAndClientMessageId(
            UUID conversationId, UUID senderId, UUID clientMessageId);
}
