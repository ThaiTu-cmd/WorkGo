package com.workgo.communication.mapper;

import com.workgo.communication.dto.request.AttachmentReq;
import com.workgo.communication.dto.request.MessageSendReq;
import com.workgo.communication.dto.response.MediaAttachmentDto;
import com.workgo.communication.dto.response.MessageDto;
import com.workgo.communication.entity.MediaAttachment;
import com.workgo.communication.entity.Message;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface MessageMapper {
    MessageDto toDto(Message message);

    MediaAttachmentDto toDto(MediaAttachment attachment);

    // The service supplies sender/conversation, hash, timestamps and validated attachments.
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "content", source = "content")
    @Mapping(target = "messageType", source = "messageType")
    @Mapping(target = "clientMessageId", source = "clientMessageId")
    Message toEntity(MessageSendReq request);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "fileUrl", source = "fileUrl")
    @Mapping(target = "fileName", source = "fileName")
    @Mapping(target = "mimeType", source = "mimeType")
    @Mapping(target = "sizeBytes", source = "sizeBytes")
    MediaAttachment toEntity(AttachmentReq request);
}
