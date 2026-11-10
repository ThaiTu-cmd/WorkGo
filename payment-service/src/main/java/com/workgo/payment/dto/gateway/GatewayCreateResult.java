package com.workgo.payment.dto.gateway;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GatewayCreateResult {

    String paymentUrl;

    String qrCodeUrl;

    String deeplink;

}
