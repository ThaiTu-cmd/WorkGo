package com.workgo.job.mapper;

import com.workgo.job.dto.request.ApplicationCreateReq;
import com.workgo.job.dto.response.*;
import com.workgo.job.entity.Application;
import java.util.List;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ApplicationMapper {
    // Proposals are supplied explicitly; Application has no inverse proposal collection.
    @Mapping(target = "jobId", source = "application.job.jobId")
    @Mapping(target = "providerId", source = "application.providerId")
    @Mapping(target = "provider", source = "provider")
    @Mapping(target = "proposals", source = "proposals")
    ApplicationDto toDto(Application application, ProviderBasicDto provider, List<ProposalDto> proposals);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "message", source = "message")
    Application toEntity(ApplicationCreateReq request);
}
