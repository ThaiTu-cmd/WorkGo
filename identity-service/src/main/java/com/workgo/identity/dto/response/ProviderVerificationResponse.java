package com.workgo.identity.dto.response;


import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.enumeration.VerificationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProviderVerificationResponse {

    UUID providerVerificationId;

    VerificationType verificationType;

    String documentType;

    VerificationStatus verificationStatus;

    Instant submittedAt;

    Instant verifiedAt;

    UUID verifiedBy;

    Instant createdAt;

    UUID providerProfileId;

}
