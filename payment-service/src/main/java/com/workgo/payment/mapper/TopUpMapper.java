package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.TopUpResponse;
import com.workgo.payment.entity.WalletTopUp;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TopUpMapper {

    @org.mapstruct.Mapping(target = "simulated", expression = "java(topUp.getGateway() == com.workgo.payment.enumeration.PaymentGateway.MOCK)")
    TopUpResponse toResponse(WalletTopUp topUp);

}
