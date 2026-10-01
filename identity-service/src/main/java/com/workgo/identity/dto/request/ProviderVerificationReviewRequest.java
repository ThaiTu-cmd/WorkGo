package com.workgo.identity.dto.request;

import com.workgo.identity.enumeration.VerificationStatus;
import com.workgo.identity.enumeration.VerificationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProviderVerificationReviewRequest {

    VerificationStatus verificationStatus;

}
