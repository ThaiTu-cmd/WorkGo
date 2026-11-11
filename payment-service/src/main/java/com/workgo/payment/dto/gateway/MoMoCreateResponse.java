package com.workgo.payment.dto.gateway;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoMoCreateResponse {

    String partnerCode;

    String requestId;

    String orderId;

    Long amount;

    Long responseTime;

    //0 = tao link thanh cong
    Integer resultCode;

    String message;

    String payUrl;

    //chuoi de FE ve QR (khong phai link anh)
    String qrCodeUrl;

    String deeplink;

}
