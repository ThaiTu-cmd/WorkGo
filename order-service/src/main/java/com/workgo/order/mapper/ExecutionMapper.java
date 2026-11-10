package com.workgo.order.mapper;

import com.workgo.order.dto.response.DigitalExecutionResponse;
import com.workgo.order.dto.response.ExecutionResponse;
import com.workgo.order.dto.response.OnsiteExecutionResponse;
import com.workgo.order.entity.DigitalExecution;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.OnsiteExecution;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExecutionMapper {

    @Mapping(target = "orderId", source = "order.orderId")
    @Mapping(target = "digital", ignore = true)
    @Mapping(target = "onsite", ignore = true)
    ExecutionResponse toExecutionResponse(Execution execution);

    DigitalExecutionResponse toDigitalExecutionResponse(DigitalExecution digitalExecution);

    OnsiteExecutionResponse toOnsiteExecutionResponse(OnsiteExecution onsiteExecution);
}