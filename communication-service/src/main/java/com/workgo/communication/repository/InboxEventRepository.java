package com.workgo.communication.repository;

import com.workgo.communication.entity.InboxEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface InboxEventRepository extends MongoRepository<InboxEvent, UUID> {
    Optional<InboxEvent> findByEventId(String eventId);
}
