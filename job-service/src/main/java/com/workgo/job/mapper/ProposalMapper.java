package com.workgo.job.mapper;

import com.workgo.job.dto.request.ProposalSubmitReq;
import com.workgo.job.dto.response.ProposalDto;
import com.workgo.job.entity.Proposal;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ProposalMapper {
    @Mapping(target = "jobId", source = "job.jobId")
    @Mapping(target = "applicationId", source = "application.applicationId")
    @Mapping(target = "providerId", source = "application.providerId")
    ProposalDto toDto(Proposal proposal);

    // Service sets the job/application and currency from the job's negotiated contract.
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "price", source = "price")
    @Mapping(target = "estimatedDays", source = "estimatedDays")
    @Mapping(target = "message", source = "message")
    @Mapping(target = "terms", source = "terms")
    @Mapping(target = "expiresAt", source = "expiresAt")
    Proposal toEntity(ProposalSubmitReq request);
}
