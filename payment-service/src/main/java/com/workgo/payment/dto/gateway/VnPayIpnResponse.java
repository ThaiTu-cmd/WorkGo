package com.workgo.payment.dto.gateway;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

//vnpay doc dung ten field RspCode / Message
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VnPayIpnResponse {

    @JsonProperty("RspCode")
    String rspCode;

    @JsonProperty("Message")
    String message;

}
