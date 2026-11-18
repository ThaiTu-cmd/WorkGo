package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.SettlementResult;
import com.workgo.payment.entity.SettlementReceipt;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SettlementReceiptMapper {

    @Mapping(target = "replayed", ignore = true)
    SettlementResult toResult(SettlementReceipt receipt);

}
