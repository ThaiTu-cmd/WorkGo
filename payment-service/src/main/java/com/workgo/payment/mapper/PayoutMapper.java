package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.PayoutResponse;
import com.workgo.payment.entity.WalletPayout;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PayoutMapper {

    PayoutResponse toResponse(WalletPayout payout);

}
