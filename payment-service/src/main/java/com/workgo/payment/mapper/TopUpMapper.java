package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.TopUpResponse;
import com.workgo.payment.entity.WalletTopUp;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TopUpMapper {

    TopUpResponse toResponse(WalletTopUp topUp);

}
