package com.workgo.job.mapper;

import com.workgo.job.dto.request.JobCreateReq;
import com.workgo.job.dto.request.JobUpdateReq;
import com.workgo.job.dto.response.*;
import com.workgo.job.entity.Job;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = JobAttachmentMapper.class,
        unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface JobMapper {
    // Pass an aggregate count from the service; do not initialize the applications collection.
    @Mapping(target = "applicationCount", source = "applicationCount")
    JobSummaryDto toSummary(Job job, long applicationCount);

    @Mapping(target = "client", source = "client")
    JobDetailDto toDetail(Job job, ClientBasicDto client);

    // Relationships, IDs, status, audit fields and attachment persistence belong to the service.
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "title", source = "title")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "categoryId", source = "categoryId")
    @Mapping(target = "budgetMin", source = "budgetMin")
    @Mapping(target = "budgetMax", source = "budgetMax")
    @Mapping(target = "currency", source = "currency", defaultValue = "VND")
    @Mapping(target = "executionType", source = "executionType")
    @Mapping(target = "locationSnapshot", source = "locationSnapshot")
    @Mapping(target = "deadlineAt", source = "deadlineAt")
    Job toEntity(JobCreateReq request);

    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "title", source = "title")
    @Mapping(target = "description", source = "description")
    void updateContent(JobUpdateReq request, @MappingTarget Job job);
}
