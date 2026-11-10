package com.workgo.payment.dto.response.client;

import com.workgo.payment.enumeration.client.OrderStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentConfirmationResponse {

    UUID orderId;

    OrderStatus orderStatus;

}
