package com.workgo.trust.mapper;

import com.workgo.trust.entity.Dispute;
import com.workgo.trust.dto.response.DisputeDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface DisputeMapper {
    DisputeDto toDto(Dispute entity);
}
