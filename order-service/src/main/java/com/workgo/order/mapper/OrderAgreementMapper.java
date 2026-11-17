package com.workgo.order.mapper;

import com.workgo.order.dto.response.OrderAgreementVersionResponse;
import com.workgo.order.dto.response.OrderAmendmentResponse;
import com.workgo.order.entity.OrderAgreementVersion;
import com.workgo.order.entity.OrderAmendment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderAgreementMapper {

    OrderAgreementVersionResponse toOrderAgreementVersionResponse(OrderAgreementVersion version);

    OrderAmendmentResponse toOrderAmendmentResponse(OrderAmendment amendment);
}
