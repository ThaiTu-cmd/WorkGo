package com.workgo.payment.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletResponse {

    UUID userId;

    long balance;

    long outstandingFee;

    boolean mayStartNewWork;

    String currency;

}
