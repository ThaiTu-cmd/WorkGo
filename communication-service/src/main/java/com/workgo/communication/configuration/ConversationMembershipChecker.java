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
    @org.springframework.beans.factory.annotation.Autowired private com.workgo.communication.service.ConversationService conversations;

    public boolean isParticipant(UUID conversationId, UUID userId) {
        if(conversations!=null){try{conversations.requireParticipant(userId,conversationId);return true;}catch(com.workgo.communication.exception.AppException denied){return false;}}
        // Read-only bridge until the domain repository is introduced in steps 4–5.
        return mongo.exists(Query.query(Criteria.where("_id").is(conversationId.toString())
                .and("participants.userId").is(userId.toString())), "conversations");
    }
}
