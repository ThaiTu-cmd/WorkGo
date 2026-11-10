package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.PaymentResponse;
import com.workgo.payment.entity.Payment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    PaymentResponse toResponse(Payment payment);

}
