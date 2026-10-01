package com.workgo.identity.dto.response;

import com.workgo.identity.enumeration.ProviderType;
import com.workgo.identity.enumeration.VerificationStatus;
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
public class ProviderProfileResponse {

    UUID providerProfileId;

    ProviderType providerType;

    String businessName;

    String bio;

    VerificationStatus verificationStatus;

    double ratingAvg;

    long ratingCount;

    int completedOrderCount;

    boolean isAcceptingOrders;

    Instant joinedAt;

    UUID userId;
}
