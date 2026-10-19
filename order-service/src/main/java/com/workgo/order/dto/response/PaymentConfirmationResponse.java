package com.workgo.order.dto.response;

import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentConfirmationResponse <S> {

    UUID orderId;
    OrderStatus orderStatus;
    PaymentStatus paymentStatus;
    S executionStatus;

    String checkinCode;
}