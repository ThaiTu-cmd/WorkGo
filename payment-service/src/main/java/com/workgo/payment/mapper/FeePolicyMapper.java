package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.FeePolicyResponse;
import com.workgo.payment.entity.FeePolicyVersion;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FeePolicyMapper {

    FeePolicyResponse toResponse(FeePolicyVersion feePolicyVersion);

}
