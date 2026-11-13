package com.workgo.communication.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ConversationMembershipChecker {
    private final MongoTemplate mongo;

    public boolean isParticipant(UUID conversationId, UUID userId) {
        // Read-only bridge until the domain repository is introduced in steps 4–5.
        return mongo.exists(Query.query(Criteria.where("_id").is(conversationId.toString())
                .and("participants.userId").is(userId.toString())), "conversations");
    }
}
