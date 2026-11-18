package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.FeeAssessmentResponse;
import com.workgo.payment.entity.FeeAssessment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FeeAssessmentMapper {

    @Mapping(target = "outstandingAmount", expression = "java(feeAssessment.getAmount() - feeAssessment.getCollectedAmount())")
    FeeAssessmentResponse toResponse(FeeAssessment feeAssessment);

}
