package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.RefundResponse;
import com.workgo.payment.entity.Refund;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RefundMapper {

    @Mapping(target = "paymentId", source = "payment.paymentId")
    @Mapping(target = "escrowAccountId", source = "escrowAccount.escrowAccountId")
    RefundResponse toResponse(Refund refund);

}
