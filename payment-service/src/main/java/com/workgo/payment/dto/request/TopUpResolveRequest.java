package com.workgo.payment.dto.request;

import com.workgo.payment.enumeration.TopUpStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopUpResolveRequest {

    TopUpStatus result;

    String externalReference;

    String reason;

}
