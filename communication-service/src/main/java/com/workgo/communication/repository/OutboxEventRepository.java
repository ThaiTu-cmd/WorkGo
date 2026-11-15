package com.workgo.communication.repository;

import com.workgo.communication.entity.OutboxEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.UUID;

public interface OutboxEventRepository extends MongoRepository<OutboxEvent, UUID> {
}
