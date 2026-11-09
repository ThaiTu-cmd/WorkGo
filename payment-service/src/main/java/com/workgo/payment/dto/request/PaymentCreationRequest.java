package com.workgo.payment.dto.request;


import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentCreationRequest {

    UUID orderId;

    PaymentGateway gateway;

    PaymentMethod paymentMethod;

}
