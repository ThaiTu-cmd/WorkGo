package com.workgo.payment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PayoutCreationRequest {

    BigDecimal amount;

    String bankCode;

    String accountNumber;

    String accountName;

    java.util.UUID verifiedBeneficiaryId;

    // Original proof issued by the beneficiary verification adapter, never browser assertions.
    java.util.Map<String, String> beneficiaryEvidence;

}
