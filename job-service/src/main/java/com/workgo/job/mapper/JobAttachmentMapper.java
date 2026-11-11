package com.workgo.job.mapper;

import com.workgo.job.dto.request.JobAttachmentReq;
import com.workgo.job.dto.response.JobAttachmentDto;
import com.workgo.job.entity.JobAttachment;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface JobAttachmentMapper {
    JobAttachmentDto toDto(JobAttachment attachment);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "fileUrl", source = "fileUrl")
    @Mapping(target = "fileName", source = "fileName")
    @Mapping(target = "mimeType", source = "mimeType")
    @Mapping(target = "sizeBytes", source = "sizeBytes")
    JobAttachment toEntity(JobAttachmentReq request);
}
