package com.workgo.payment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

//dung chung cho freeze va unfreeze
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EscrowFreezeRequest {

    UUID orderId;

    UUID disputeId;

    String reasonCode;

}
