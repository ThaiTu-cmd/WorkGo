package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.EscrowTransactionResponse;
import com.workgo.payment.entity.EscrowTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EscrowTransactionMapper {

    @Mapping(target = "escrowAccountId", source = "escrowAccount.escrowAccountId")
    EscrowTransactionResponse toResponse(EscrowTransaction escrowTransaction);

}
