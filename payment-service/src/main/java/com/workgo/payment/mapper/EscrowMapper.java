package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.entity.EscrowAccount;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = EscrowTransactionMapper.class)
public interface EscrowMapper {

    @Mapping(target = "paymentId", source = "payment.paymentId")
    EscrowAccountResponse toResponse(EscrowAccount escrowAccount);

}
