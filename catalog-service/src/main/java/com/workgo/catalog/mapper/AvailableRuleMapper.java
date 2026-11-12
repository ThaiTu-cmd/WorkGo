package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.AvailableRuleUpdateRequest;
import com.workgo.catalog.dto.response.AvailableRuleResponse;
import com.workgo.catalog.entity.AvailableRule;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface AvailableRuleMapper {

    @Mapping(target = "serviceId", source = "service.serviceId")
    AvailableRuleResponse toAvailableRuleResponse(AvailableRule availableRule);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateRule(@MappingTarget AvailableRule rule, AvailableRuleUpdateRequest request);

}
