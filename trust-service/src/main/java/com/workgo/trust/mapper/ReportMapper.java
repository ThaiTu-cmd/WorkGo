package com.workgo.trust.mapper;

import com.workgo.trust.entity.Report;
import com.workgo.trust.dto.response.ReportDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ReportMapper {
    ReportDto toDto(Report entity);
}
