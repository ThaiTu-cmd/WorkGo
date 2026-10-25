package com.workgo.order.mapper;

import com.workgo.order.dto.response.WorkEvidenceResponse;
import com.workgo.order.entity.WorkEvidence;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WorkEvidenceMapper {

    @Mapping(target = "executionId", source = "execution.executionId")
    WorkEvidenceResponse toWorkEvidenceResponse(WorkEvidence workEvidence);

}
