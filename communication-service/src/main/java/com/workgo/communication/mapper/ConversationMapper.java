package com.workgo.communication.mapper;

import com.workgo.communication.dto.request.ConversationCreateReq;
import com.workgo.communication.dto.response.ConversationDto;
import com.workgo.communication.dto.response.ParticipantDto;
import com.workgo.communication.entity.Conversation;
import com.workgo.communication.entity.ConversationParticipant;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ConversationMapper {
    // Unread count is computed for the caller by the service, never inferred from lastReadAt.
    @Mapping(target = "unreadCount", source = "unreadCount")
    ConversationDto toDto(Conversation conversation, long unreadCount);

    ParticipantDto toDto(ConversationParticipant participant);

    // The service sets identity, membership, canonical context/directKey and server timestamps.
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "conversationType", source = "conversationType")
    @Mapping(target = "contextType", source = "contextType")
    @Mapping(target = "contextId", source = "contextId")
    Conversation toEntity(ConversationCreateReq request);
}
