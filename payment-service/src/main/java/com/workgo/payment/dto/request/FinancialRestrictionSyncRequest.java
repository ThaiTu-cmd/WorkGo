package com.workgo.payment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FinancialRestrictionSyncRequest {

    Boolean restricted;

    Long version;

}
