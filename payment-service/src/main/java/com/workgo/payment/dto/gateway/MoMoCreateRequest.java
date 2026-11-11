package com.workgo.payment.dto.gateway;


import lombok.*;
import lombok.experimental.FieldDefaults;

//body POST {endpoint}/create cua MoMo v2
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoMoCreateRequest {

    String partnerCode;

    String requestId;

    Long amount;

    String orderId;

    String orderInfo;

    String redirectUrl;

    String ipnUrl;

    String requestType;

    String extraData;

    String lang;

    String signature;

}
