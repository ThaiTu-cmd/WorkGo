package com.workgo.communication.mapper;

import com.workgo.communication.dto.request.InternalNotificationCreateReq;
import com.workgo.communication.dto.response.NotificationDto;
import com.workgo.communication.entity.Notification;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface NotificationMapper {
    NotificationDto toDto(Notification notification);

    // eventId belongs to InboxEvent; identity and timestamps are set by the service.
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "recipientId", source = "recipientId")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "title", source = "title")
    @Mapping(target = "content", source = "content")
    @Mapping(target = "referenceType", source = "referenceType")
    @Mapping(target = "referenceId", source = "referenceId")
    Notification toEntity(InternalNotificationCreateReq request);
}
