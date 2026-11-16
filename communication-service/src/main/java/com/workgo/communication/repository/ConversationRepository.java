package com.workgo.communication.repository;

import com.workgo.communication.entity.Conversation;
import com.workgo.communication.enumeration.ConversationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends MongoRepository<Conversation, UUID> {
    Page<Conversation> findByParticipants_UserId(UUID userId, Pageable pageable);

    Optional<Conversation> findByDirectKeyAndConversationType(String directKey, ConversationType conversationType);
}
