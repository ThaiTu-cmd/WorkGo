package com.workgo.payment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EscrowReleaseRequest {

    UUID orderId;

    //chi dispute phan xu xong moi duoc release escrow dang FROZEN
    UUID disputeId;

}
